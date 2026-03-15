"""
Task status API endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException
from celery.result import AsyncResult
from app.core.celery_config import celery_app
from app.core.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/{task_id}")
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the status of a Celery task.
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    result = {
        "task_id": task_id,
        "status": task_result.status,
        "result": None,
    }
    
    if task_result.status == "SUCCESS":
        result["result"] = task_result.result
    elif task_result.status == "FAILURE":
        result["result"] = str(task_result.result)
    elif task_result.status == "PROGRESS":
        result["result"] = task_result.info # contains current and total
        
    return result
