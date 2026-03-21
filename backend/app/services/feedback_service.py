"""
Feedback service: Feedback CRUD + CSV processing + AI analysis.
"""
import pandas as pd
from io import BytesIO
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Feedback, AnalysisResult, Source
from app.services.ai_service import analyze_text, CONFIDENCE_THRESHOLD
from app.services.notification_service import (
    send_telegram_alert_async, 
    format_negative_feedback_message, 
    format_batch_negative_feedback_message
)
from app.core.logging import get_logger

logger = get_logger(__name__)

# ==============================================
# PLATFORM MAPPING FOR CSV IMPORT
# ==============================================
PLATFORM_MAPPING = {
    "SHOPEE": {
        "content_cols": ["YNedDV", "content", "comment", "shopee-product-rating__content"],
        "author_cols": ["InK5kS", "author", "name", "shopee-product-rating__author-name"],
        "time_cols": ["XYk98l", "time", "date", "shopee-product-rating__time"],
        "likes_cols": ["shopee-product-rating__like-count", "like"],
    },
    "FACEBOOK": {
        "content_cols": ["xdj266r", "content", "message", "text"],
        "author_cols": ["x193iq5w", "author", "name", "user"],
        "time_cols": ["x1i10hfl", "time", "date"],
        "likes_cols": ["html-span", "likes", "reaction"],
    },
    "TIKTOK": {
        # Easy Scraper TikTok CSV format
        "content_cols": ["TUXText (2)", "content", "comment", "text"],
        "author_cols": ["TUXText", "author", "name", "user"],
        "time_cols": ["TUXText (3)", "time", "date"],
        "likes_cols": ["TUXText (5)", "like", "thich"],
    },
    "OTHER": {
        "content_cols": ["content", "comment", "review", "text", "noidung", "feedback"],
        "author_cols": ["user", "name", "author", "khachhang"],
        "time_cols": ["time", "date", "ngay"],
        "likes_cols": ["like", "thich"],
    },
}


def _find_column(df_columns, possible_names):
    """Find a matching column name in the DataFrame."""
    df_cols_lower = {col.lower().strip(): col for col in df_columns}
    for name in possible_names:
        if name.lower() in df_cols_lower:
            return df_cols_lower[name.lower()]
    return None


def create_feedback_with_analysis(
    db: Session,
    content: str,
    source_id: UUID = None,
    custom_time: datetime = None,
    created_by: UUID = None,
    author_name: str = "Khách hàng ẩn danh",
) -> tuple[Feedback, bool, dict]:
    """Create a Feedback with automatic AI sentiment analysis.
    Low-confidence predictions are flagged as NEEDS_REVIEW and get Gemini double-check.
    Returns: (Feedback, is_negative_alert, alert_data)
    """
    # Determine status later based on confidence
    db_feedback = Feedback(
        raw_content=content,
        source_id=source_id,
        status="PROCESSED",
        created_by=created_by,
    )

    if custom_time:
        db_feedback.received_at = custom_time

    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)

    # AI Analysis
    source_name = "OTHER"
    if source_id:
        source = db.query(Source).filter(Source.id == source_id).first()
        if source:
            source_name = source.platform

    ai_result = analyze_text(content, source=source_name)

    # If low confidence, flag for review and ask Gemini for second opinion
    # IMPORTANT: Non-blocking call - Gemini has 5s timeout, no retry
    # If Gemini rate limited, fallback to PhoBERT immediately
    gemini_label = None
    if ai_result["needs_review"]:
        db_feedback.status = "NEEDS_REVIEW"
        try:
            from app.services.gemini_service import verify_sentiment_with_gemini
            gemini_label = verify_sentiment_with_gemini(content, ai_result["label"])
            logger.info(
                f"Low confidence ({ai_result['confidence']:.2f}): "
                f"PhoBERT={ai_result['label']}, Gemini={gemini_label}"
            )
            # If Gemini agrees with PhoBERT, auto-resolve
            if gemini_label == ai_result["label"]:
                db_feedback.status = "PROCESSED"
            # If Gemini disagrees or unavailable (rate limit), keep NEEDS_REVIEW for manual review
        except Exception as e:
            logger.warning(f"Gemini double-check failed: {e}")
            # Keep PhoBERT label, status remains NEEDS_REVIEW

    db_analysis = AnalysisResult(
        feedback_id=db_feedback.id,
        sentiment_score=ai_result["score"],
        sentiment_label=ai_result["label"],
        keywords=ai_result["keywords"],
        confidence=ai_result["confidence"],
        is_manual_override=False,
        gemini_label=gemini_label,
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)

    # Determine if this needs a negative alert, but don't send it here (let caller handle batching)
    is_negative_alert = False
    alert_data = {}
    final_label = gemini_label if gemini_label else ai_result["label"]
    
    if final_label == "NEGATIVE":
        is_negative_alert = True
        alert_data = {
            "platform": source_name,
            "content": content,
            "score": ai_result["score"],
            "author": author_name
        }

    return db_feedback, is_negative_alert, alert_data


def create_pending_feedback(
    db: Session,
    content: str,
    source_id: UUID = None,
    custom_time: datetime = None,
    created_by: UUID = None,
    author_name: str = "Khách hàng ẩn danh",
) -> Feedback:
    """Create a Feedback with PENDING_ANALYSIS status to be analyzed later."""
    db_feedback = Feedback(
        raw_content=content,
        source_id=source_id,
        status="PENDING_ANALYSIS",
        created_by=created_by,
    )

    if custom_time:
        db_feedback.received_at = custom_time

    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)

    return db_feedback


def run_ai_analysis_for_feedback(
    db: Session,
    feedback_id: UUID,
    author_name: str = "Khách hàng ẩn danh",
) -> tuple[bool, dict]:
    """Run AI analysis for an existing feedback and update its status.
    Returns: (is_negative_alert, alert_data)
    """
    db_feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not db_feedback:
        return False, {}
    
    content = db_feedback.raw_content
    
    # AI Analysis
    source_name = "OTHER"
    if db_feedback.source_id:
        source = db.query(Source).filter(Source.id == db_feedback.source_id).first()
        if source:
            source_name = source.platform

    ai_result = analyze_text(content, source=source_name)

    # If low confidence, flag for review and ask Gemini for second opinion
    gemini_label = None
    if ai_result["needs_review"]:
        db_feedback.status = "NEEDS_REVIEW"
        try:
            from app.services.gemini_service import verify_sentiment_with_gemini
            gemini_label = verify_sentiment_with_gemini(content, ai_result["label"])
            logger.info(
                f"Low confidence ({ai_result['confidence']:.2f}): "
                f"PhoBERT={ai_result['label']}, Gemini={gemini_label}"
            )
            # If Gemini agrees with PhoBERT, auto-resolve
            if gemini_label == ai_result["label"]:
                db_feedback.status = "PROCESSED"
        except Exception as e:
            logger.warning(f"Gemini double-check failed: {e}")
    else:
        db_feedback.status = "PROCESSED"

    db_analysis = AnalysisResult(
        feedback_id=db_feedback.id,
        sentiment_score=ai_result["score"],
        sentiment_label=ai_result["label"],
        keywords=ai_result["keywords"],
        confidence=ai_result["confidence"],
        is_manual_override=False,
        gemini_label=gemini_label,
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)

    is_negative_alert = False
    alert_data = {}
    final_label = gemini_label if gemini_label else ai_result["label"]
    
    if final_label == "NEGATIVE":
        is_negative_alert = True
        alert_data = {
            "platform": source_name,
            "content": content,
            "score": ai_result["score"],
            "author": author_name
        }

    return is_negative_alert, alert_data



def get_feedbacks(db: Session, skip: int = 0, limit: int = 20) -> List[Feedback]:
    """Get feedbacks ordered by most recent."""
    return (
        db.query(Feedback)
        .order_by(Feedback.received_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_feedback_by_id(db: Session, feedback_id: UUID) -> Optional[Feedback]:
    return db.query(Feedback).filter(Feedback.id == feedback_id).first()


def get_review_queue(db: Session, skip: int = 0, limit: int = 20) -> List[Feedback]:
    """Get feedbacks that need manual review (low confidence or model disagreement)."""
    return (
        db.query(Feedback)
        .filter(Feedback.status == "NEEDS_REVIEW")
        .order_by(Feedback.received_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_review_queue_count(db: Session) -> int:
    """Get total count of feedbacks needing review."""
    return db.query(Feedback).filter(Feedback.status == "NEEDS_REVIEW").count()


def update_analysis_result(
    db: Session, feedback_id: UUID, new_label: str
) -> Optional[AnalysisResult]:
    """Update analysis result (manual override). Marks as manually corrected."""
    analysis = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.feedback_id == feedback_id)
        .first()
    )

    if not analysis:
        return None

    analysis.sentiment_label = new_label
    analysis.is_manual_override = True

    if new_label == "POSITIVE":
        analysis.sentiment_score = 0.9
    elif new_label == "NEGATIVE":
        analysis.sentiment_score = -0.9
    else:
        analysis.sentiment_score = 0.0

    # Also mark feedback as PROCESSED (resolved from NEEDS_REVIEW)
    feedback = (
        db.query(Feedback)
        .filter(Feedback.id == feedback_id)
        .first()
    )
    if feedback and feedback.status == "NEEDS_REVIEW":
        feedback.status = "PROCESSED"

    db.commit()
    db.refresh(analysis)
    logger.info(f"Manual override: feedback={feedback_id} → {new_label}")
    return analysis


def process_csv_upload(db: Session, file_contents: bytes, platform: str = "OTHER"):
    """Process CSV upload and import feedbacks into DB."""
    try:
        df = pd.read_csv(BytesIO(file_contents))
        config = PLATFORM_MAPPING.get(platform.upper(), PLATFORM_MAPPING["OTHER"])
        content_col = _find_column(df.columns, config["content_cols"])

        if not content_col:
            logger.error(
                f"[{platform}] Content column not found. Columns: {list(df.columns)}"
            )
            return

        logger.info(f"[{platform}] Mapped column '{content_col}' as content. Processing...")

        author_col = _find_column(df.columns, config["author_cols"])
        time_col = _find_column(df.columns, config["time_cols"])
        likes_col = _find_column(df.columns, config["likes_cols"])

        source = db.query(Source).filter(Source.platform == platform.upper()).first()
        source_id = source.id if source else None

        count = 0
        negative_alerts = []
        for _, row in df.iterrows():
            raw_text = row[content_col]
            if pd.isna(raw_text) or str(raw_text).strip() == "":
                continue

            text = str(raw_text)
            customer_meta = {"imported_from": platform}

            if author_col and pd.notna(row[author_col]):
                customer_meta["name"] = str(row[author_col])
            if time_col and pd.notna(row[time_col]):
                time_val = str(row[time_col])
                if platform == "SHOPEE" and "|" in time_val:
                    time_val = time_val.split("|")[0].strip()
                customer_meta["time_posted"] = time_val
            if likes_col and pd.notna(row[likes_col]):
                customer_meta["likes"] = str(row[likes_col])

            try:
                db_feedback, is_negative, alert_info = create_feedback_with_analysis(
                    db, text, source_id=source_id, author_name=customer_meta.get("name", "Khách hàng ẩn danh")
                )
                db_feedback.customer_info = customer_meta
                db.commit()
                count += 1
                
                if is_negative:
                    negative_alerts.append(alert_info)
                    
            except Exception as e:
                logger.warning(f"Row error: {e}")
                continue

        logger.info(f"[{platform}] Processed {count} rows successfully")
        
        # Dispatch batched alerts
        if negative_alerts:
            if len(negative_alerts) == 1:
                # Send single alert
                a = negative_alerts[0]
                msg = format_negative_feedback_message(
                    platform=a["platform"], content=a["content"], score=a["score"], author=a["author"]
                )
                send_telegram_alert_async(msg)
            else:
                # Send compiled batched alert
                msg = format_batch_negative_feedback_message(negative_alerts)
                send_telegram_alert_async(msg)
    except Exception as e:
        logger.error(f"CSV read error: {e}")
