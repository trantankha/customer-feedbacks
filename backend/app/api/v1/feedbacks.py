"""
Feedback API endpoints.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from dateutil import parser

from app.core.dependencies import get_db, get_current_user, get_current_user_optional
from app.models import User
from app.schemas.feedback import (
    FeedbackResponse, AnalysisUpdate, ScrapeBatchRequest, ReviewQueueResponse,
)
from app.services import feedback_service, export_service, source_service, tasks
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/feedbacks", tags=["Feedbacks"])


@router.get("", response_model=List[FeedbackResponse])
def read_feedbacks(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of feedbacks."""
    return feedback_service.get_feedbacks(db, skip, limit)


@router.get("/review-queue", response_model=ReviewQueueResponse)
def get_review_queue(
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get feedbacks that need manual review (low confidence or model disagreement)."""
    skip = (page - 1) * per_page
    feedbacks = feedback_service.get_review_queue(db, skip, per_page)
    total_count = feedback_service.get_review_queue_count(db)

    return {
        "feedbacks": feedbacks,
        "total_count": total_count,
        "current_page": page,
        "per_page": per_page,
    }


@router.post("/test-create")
def test_create_feedback(
    content: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Quick test: create a single feedback."""
    fb = feedback_service.create_feedback_with_analysis(
        db, content, created_by=current_user.id
    )
    return {"message": "Feedback created", "data": fb}


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    platform: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a CSV file to import feedbacks via Celery."""
    contents = await file.read()
    
    # Simple check for file size (optional)
    if not contents:
        raise HTTPException(status_code=400, detail="File is empty")
        
    task = tasks.process_csv_import_task.delay(
        contents, 
        platform, 
        str(current_user.id)
    )

    return {
        "message": f"File {platform} đã được tiếp nhận. Đang xử lý trong nền...",
        "task_id": task.id,
        "filename": file.filename,
    }


@router.get("/export")
def export_feedbacks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export feedbacks to Excel."""
    filepath = export_service.export_feedbacks_to_excel(db)
    return FileResponse(
        path=filepath,
        filename=filepath.split("/")[-1] if "/" in filepath else filepath.split("\\")[-1],
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.put("/{feedback_id}/analysis")
def update_feedback_analysis(
    feedback_id: UUID,
    payload: AnalysisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update analysis result (manual override). Marks as manually corrected."""
    result = feedback_service.update_analysis_result(db, feedback_id, payload.sentiment_label)
    if not result:
        raise HTTPException(status_code=404, detail="Không tìm thấy Feedback")
    return {"message": "Cập nhật thành công", "data": result}


@router.post("/batch-import")
def batch_import_feedbacks(
    payload: ScrapeBatchRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Import batch feedbacks from Chrome Extension via Celery."""
    logger.info(f"Received {len(payload.items)} comments from Extension. Offloading to Celery.")

    # Convert Pydantic models to dict for Celery serialization
    items_dict = [item.model_dump() for item in payload.items]
    
    task = tasks.process_batch_import_task.delay(
        items_dict,
        payload.items[0].source_platform if payload.items else "OTHER",
        str(current_user.id) if current_user else None,
        payload.url
    )

    return {
        "message": "Yêu cầu đã được tiếp nhận. Đang xử lý...", 
        "task_id": task.id,
        "count": len(payload.items)
    }
