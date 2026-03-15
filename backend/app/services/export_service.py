"""
Export service: Excel export for feedbacks.
"""
import os
from datetime import datetime
from typing import List

import pandas as pd
from sqlalchemy.orm import Session

from app.models import Source, Feedback
from app.services.feedback_service import get_feedbacks
from app.core.logging import get_logger

logger = get_logger(__name__)


def export_feedbacks_to_excel(db: Session) -> str:
    """
    Export feedbacks to an Excel file.
    Returns the file path of the generated report.
    """
    sources = db.query(Source).all()
    source_map = {str(s.id): s.name for s in sources}

    feedbacks = get_feedbacks(db, limit=1000)

    data = []
    for f in feedbacks:
        source_name = (
            f.customer_info.get("imported_from") if f.customer_info else "Unknown"
        )

        if f.source_id and str(f.source_id) in source_map:
            source_name = source_map[str(f.source_id)]

        item = {
            "ID": str(f.id),
            "Nguồn": source_name,
            "Thời gian": (
                f.customer_info.get("original_timestamp") if f.customer_info else ""
            ),
            "Nội dung gốc": f.raw_content,
            "Người gửi": f.customer_info.get("name") if f.customer_info else "",
            "Likes": f.customer_info.get("likes") if f.customer_info else 0,
            "Cảm xúc (AI)": f.analysis.sentiment_label if f.analysis else "N/A",
            "Điểm số": f.analysis.sentiment_score if f.analysis else 0,
            "Từ khóa": (
                ", ".join(f.analysis.keywords)
                if f.analysis and f.analysis.keywords
                else ""
            ),
        }
        data.append(item)

    df = pd.DataFrame(data)

    filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    filepath = os.path.join("tmp", filename)

    os.makedirs("tmp", exist_ok=True)
    df.to_excel(filepath, index=False, engine="openpyxl")

    logger.info(f"Exported {len(data)} feedbacks to {filepath}")
    return filepath
