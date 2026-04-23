"""
Celery tasks for background processing.
"""
import pandas as pd
from io import BytesIO
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
from dateutil import parser
from celery import chord

from app.core.celery_config import celery_app
from app.db.session import SessionLocal
from app.core.config import settings
from app.services import feedback_service, source_service, email_service, tasks
from app.services.notification_service import (
    send_telegram_alert_async, 
    format_negative_feedback_message, 
    format_batch_negative_feedback_message
)
from app.core.logging import get_logger

logger = get_logger(__name__)

@celery_app.task(bind=True, rate_limit="30/m", autoretry_for=(Exception,), retry_kwargs={'countdown': 10, 'max_retries': 3})
def analyze_single_feedback_task(self, feedback_id: str, author_name: str):
    """
    Independent Celery task to analyze a single feedback.
    Applies rate limits to avoid getting blocked by Gemini API.
    """
    db = SessionLocal()
    try:
        is_negative, alert_info = feedback_service.run_ai_analysis_for_feedback(
            db, UUID(feedback_id), author_name
        )
        return alert_info if is_negative else None
    except Exception as e:
        logger.error(f"Single task error for {feedback_id}: {e}")
        raise e
    finally:
        db.close()


@celery_app.task(bind=True)
def finalize_import_task(self, results, platform: str, processed_count: int, total_rows: int):
    """
    Fired by Celery chord when ALL analyze_single_feedback_tasks finish.
    Dispatches batched notifications and summary emails.
    """
    # Filter out None results to leave only actual negative alerts
    negative_alerts = [res for res in results if res is not None]
    
    if negative_alerts:
        # 1. Telegram Alert
        if len(negative_alerts) == 1:
            a = negative_alerts[0]
            msg = format_negative_feedback_message(
                platform=a["platform"], content=a["content"], score=a["score"], author=a["author"]
            )
            send_telegram_alert_async(msg)
            
            # 2. Email Alert
            if settings.ADMIN_EMAIL:
                html_msg = email_service.format_negative_alert_html(
                    platform=a["platform"], content=a["content"], score=a["score"], author=a["author"]
                )
                send_email_task.delay(
                    to_email=settings.ADMIN_EMAIL,
                    subject=f"🚨 CẢNH BÁO: Phản hồi tiêu cực từ {a['platform']}",
                    html_content=html_msg
                )
        else:
            msg = format_batch_negative_feedback_message(negative_alerts)
            send_telegram_alert_async(msg)

    # 3. Import Summary Email
    if settings.ADMIN_EMAIL:
        summary_html = email_service.format_import_summary_html(
            platform=platform, 
            processed=processed_count, 
            total=total_rows, 
            negative_count=len(negative_alerts)
        )
        send_email_task.delay(
            to_email=settings.ADMIN_EMAIL,
            subject=f"✅ Hoàn tất Import dữ liệu: {platform}",
            html_content=summary_html
        )

    return {"status": "success", "processed": processed_count, "total": total_rows, "negatives": len(negative_alerts)}


@celery_app.task(bind=True)
def process_csv_import_task(self, file_contents: bytes, platform: str, user_id: str):
    """
    Celery task to process CSV upload and import feedbacks.
    """
    db = SessionLocal()
    try:
        df = pd.read_csv(BytesIO(file_contents))
        config = feedback_service.PLATFORM_MAPPING.get(platform.upper(), feedback_service.PLATFORM_MAPPING["OTHER"])
        content_col = feedback_service._find_column(df.columns, config["content_cols"])

        if not content_col:
            logger.error(f"[{platform}] Content column not found.")
            return {"status": "error", "message": "Content column not found"}

        author_col = feedback_service._find_column(df.columns, config["author_cols"])
        time_col = feedback_service._find_column(df.columns, config["time_cols"])
        likes_col = feedback_service._find_column(df.columns, config["likes_cols"])

        source = source_service.get_source_by_platform(db, platform)
        source_id = source.id if source else None

        total_rows = len(df)
        processed_count = 0
        created_tasks = []

        for i, row in df.iterrows():
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

            author_name_val = customer_meta.get("name", "Khách hàng ẩn danh")

            try:
                # Fast insertion, NO ai analysis yet
                db_feedback = feedback_service.create_pending_feedback(
                    db, 
                    text, 
                    source_id=source_id, 
                    author_name=author_name_val,
                    created_by=UUID(user_id) if user_id else None
                )
                db_feedback.customer_info = customer_meta
                
                created_tasks.append((str(db_feedback.id), author_name_val))
                processed_count += 1

                # Commit in batches of 20 to improve insertion performance
                if processed_count % 20 == 0:
                    db.commit()
                    self.update_state(state='PROGRESS', meta={'current': processed_count, 'total': total_rows})
                    
            except Exception as e:
                logger.warning(f"Row error: {e}")
                db.rollback()
                continue

        db.commit()
        logger.info(f"[{platform}] Created {processed_count} pending feedbacks. Dispatching AI tasks in chord...")
        
        if created_tasks:
            # Dispatch parallel tasks using Celery chord
            task_signatures = [analyze_single_feedback_task.s(fid, fname) for fid, fname in created_tasks]
            chord(task_signatures)(finalize_import_task.s(platform, processed_count, total_rows))
        else:
            # If all rows were empty or failed to insert, just finalize directly
            finalize_import_task.delay([], platform, processed_count, total_rows)

        return {"status": "queued_for_analysis", "processed": processed_count, "total": total_rows}

    except Exception as e:
        logger.error(f"CSV task error: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@celery_app.task(bind=True)
def process_batch_import_task(self, items: List[dict], source_platform: str, user_id: str, original_url: str):
    """
    Celery task to process batch imports from Chrome Extension.
    """
    db = SessionLocal()
    try:
        count = 0
        created_tasks = []
        source = source_service.get_source_by_platform(db, source_platform)
        source_id = source.id if source else None
        total_items = len(items)

        for i, item_dict in enumerate(items):
            try:
                content = item_dict.get("content")
                author_name = item_dict.get("author_name", "Khách hàng ẩn danh")
                created_at = item_dict.get("created_at")
                original_timestamp = item_dict.get("original_timestamp")
                likes = item_dict.get("likes", 0)

                final_time = None
                time_str_to_parse = original_timestamp or created_at
                if time_str_to_parse:
                    try:
                        final_time = parser.parse(time_str_to_parse)
                    except Exception:
                        final_time = datetime.now()

                # Fast insertion, NO ai analysis yet
                db_feedback = feedback_service.create_pending_feedback(
                    db,
                    content,
                    source_id=source_id,
                    custom_time=final_time,
                    created_by=UUID(user_id) if user_id else None,
                    author_name=author_name,
                )

                info_data = {
                    "name": author_name,
                    "likes": str(likes),
                    "imported_from": "chrome_extension",
                    "original_url": original_url,
                    "original_timestamp": original_timestamp,
                }

                db_feedback.customer_info = info_data
                
                created_tasks.append((str(db_feedback.id), author_name))
                count += 1
                
                if count % 20 == 0:
                    db.commit()
                    self.update_state(state='PROGRESS', meta={'current': count, 'total': total_items})
                    
            except Exception as e:
                logger.error(f"Batch import task row error: {e}")
                db.rollback()
                continue

        db.commit()
        logger.info(f"[{source_platform}] Created {count} pending feedbacks. Dispatching AI tasks in chord...")
        
        if created_tasks:
            task_signatures = [analyze_single_feedback_task.s(fid, fname) for fid, fname in created_tasks]
            chord(task_signatures)(finalize_import_task.s(source_platform, count, total_items))
        else:
            finalize_import_task.delay([], source_platform, count, total_items)

        return {"status": "queued_for_analysis", "processed": count, "total": total_items}

    except Exception as e:
        logger.error(f"Batch task error: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@celery_app.task(
    bind=True, 
    autoretry_for=(Exception,), 
    retry_kwargs={'max_retries': 3, 'countdown': 60}
)
def send_email_task(self, to_email: str, subject: str, html_content: str):
    """
    Background task to send email with auto-retry on failure.
    """
    logger.info(f"Sending email task to {to_email}: {subject}")
    success = email_service.send_email(to_email, subject, html_content)
    if not success:
        logger.error(f"Failed to send email to {to_email}. Retrying...")
        raise Exception("Resend delivery failed")
    return {"status": "success", "to": to_email}

@celery_app.task(bind=True)
def archive_old_feedbacks_task(self, days_old: int = 30):
    """
    Celery periodic task to archive feedback older than X days.
    It clears out the raw_content (to save space) but keeps the analysis results
    and customer_info metadata.
    """
    from app.models import Feedback
    db = SessionLocal()
    try:
        cutoff_date = datetime.now() - timedelta(days=days_old)
        
        # Find all feedbacks older than cutoff_date that still have raw_content
        feedbacks = db.query(Feedback).filter(
            Feedback.received_at < cutoff_date,
            Feedback.raw_content != "[Đã lưu trữ để tiết kiệm bộ nhớ]",
            Feedback.raw_content != ""
        ).all()
        
        if not feedbacks:
            logger.info("No old feedbacks to archive today.")
            return {"status": "success", "archived_count": 0}
            
        count = 0
        for f in feedbacks:
            f.raw_content = "[Đã lưu trữ để tiết kiệm bộ nhớ]"
            count += 1
            
        db.commit()
        logger.info(f"Archived {count} feedbacks older than {days_old} days.")
        return {"status": "success", "archived_count": count}
    except Exception as e:
        db.rollback()
        logger.error(f"Error archiving feedbacks: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
