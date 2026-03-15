"""
Customer service: profiles and history.
"""
import pandas as pd
from typing import List, Dict, Any, Tuple

from sqlalchemy.orm import Session

from app.models import Feedback
from app.core.logging import get_logger

logger = get_logger(__name__)


def get_customer_profiles(
    db: Session, skip: int = 0, limit: int = 10
) -> Tuple[List[Dict[str, Any]], int]:
    """Get customer profiles with pagination."""
    feedbacks = db.query(Feedback).all()

    if not feedbacks:
        return [], 0

    data = []
    for f in feedbacks:
        name = "Anonymous"
        if f.customer_info and "name" in f.customer_info:
            name = f.customer_info["name"]

        data.append({
            "name": name,
            "source_id": f.source_id,
            "score": f.analysis.sentiment_score if f.analysis else 0,
            "label": f.analysis.sentiment_label if f.analysis else "NEUTRAL",
            "date": f.received_at,
        })

    df = pd.DataFrame(data)
    profiles = []
    grouped = df.groupby(["name", "source_id"])

    for (name, source_id), group in grouped:
        total = len(group)
        pos_count = len(group[group["label"] == "POSITIVE"])
        pos_ratio = round(pos_count / total, 2)
        avg_score = round(group["score"].mean(), 2)

        if avg_score > 0.5:
            trend = "Fan cứng"
        elif avg_score < -0.3:
            trend = "Khó tính"
        else:
            trend = "Trung lập"

        profiles.append({
            "name": name,
            "source_id": source_id,
            "total_comments": total,
            "positive_ratio": pos_ratio,
            "avg_score": avg_score,
            "last_interaction": str(group["date"].max()),
            "sentiment_trend": trend,
        })

    profiles.sort(key=lambda x: x["total_comments"], reverse=True)
    total_count = len(profiles)
    paginated_profiles = profiles[skip : skip + limit]

    return paginated_profiles, total_count


def get_customer_history(
    db: Session, customer_name: str, limit: int = 20
) -> List[Dict[str, Any]]:
    """Get a customer's comment history."""
    all_feedbacks = (
        db.query(Feedback).order_by(Feedback.received_at.desc()).all()
    )

    history = []
    for f in all_feedbacks:
        if f.customer_info and f.customer_info.get("name") == customer_name:
            history.append({
                "content": f.raw_content,
                "date": str(f.received_at),
                "source": f.customer_info.get("imported_from"),
                "label": f.analysis.sentiment_label if f.analysis else "Unknown",
            })
            if len(history) >= limit:
                break
    return history
