"""
Monitor API endpoints.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, get_current_user_optional
from app.models import User, MonitorTask
from app.schemas.monitor import MonitorTaskCreate, MonitorTaskResponse
from app.services import monitor_service

router = APIRouter(prefix="/monitor", tags=["Monitor"])


@router.post("", response_model=MonitorTaskResponse)
def add_monitor_task(
    payload: MonitorTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a URL monitoring task."""
    existing_tasks = (
        db.query(MonitorTask).filter(MonitorTask.url == payload.url).all()
    )

    for task in existing_tasks:
        if task.url == payload.url:
            task.is_active = True
            db.commit()
            db.refresh(task)
            return task

    new_task = monitor_service.create_monitor_task(
        db,
        url=payload.url,
        platform=payload.platform,
        memo=payload.memo,
        created_by=current_user.id,
    )
    return new_task


@router.get("", response_model=List[MonitorTaskResponse])
def get_monitor_tasks(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Get active monitor tasks."""
    return monitor_service.get_monitor_tasks(db, active_only=True)


@router.delete("/{task_id}")
def delete_monitor_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a monitor task."""
    success = monitor_service.delete_monitor_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Đã xóa task"}
