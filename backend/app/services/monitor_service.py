"""
Monitor service: Monitor task CRUD operations.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import MonitorTask
from app.core.logging import get_logger

logger = get_logger(__name__)


def get_monitor_tasks(db: Session, active_only: bool = False) -> List[MonitorTask]:
    query = db.query(MonitorTask)
    if active_only:
        query = query.filter(MonitorTask.is_active == True)
    return query.all()


def get_monitor_task_by_id(db: Session, task_id: UUID) -> Optional[MonitorTask]:
    return db.query(MonitorTask).filter(MonitorTask.id == task_id).first()


def create_monitor_task(
    db: Session,
    url: str,
    platform: str,
    memo: Optional[str] = None,
    created_by: Optional[UUID] = None,
) -> MonitorTask:
    db_task = MonitorTask(
        url=url,
        platform=platform.upper(),
        memo=memo,
        created_by=created_by,
        is_active=True,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    logger.info(f"Created monitor task for {url}")
    return db_task


def update_monitor_task_status(
    db: Session, task_id: UUID, is_active: bool
) -> Optional[MonitorTask]:
    task = get_monitor_task_by_id(db, task_id)
    if task:
        task.is_active = is_active
        db.commit()
        db.refresh(task)
    return task


def delete_monitor_task(db: Session, task_id: UUID) -> bool:
    task = get_monitor_task_by_id(db, task_id)
    if task:
        db.delete(task)
        db.commit()
        return True
    return False


def update_monitor_task_check(
    db: Session, task_id: UUID, comment_count: int
) -> Optional[MonitorTask]:
    task = get_monitor_task_by_id(db, task_id)
    if task:
        task.last_checked_at = datetime.utcnow()
        task.last_comment_count = comment_count
        db.commit()
        db.refresh(task)
    return task
