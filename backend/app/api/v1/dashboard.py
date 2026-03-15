"""
Dashboard API endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models import User
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def read_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard statistics."""
    return dashboard_service.get_stats(db)


@router.get("/keywords")
def read_keywords(
    limit: int = 15,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get popular keywords from recent feedbacks.
    
    Args:
        limit: Maximum number of keywords (default: 15)
        days: Number of recent days to consider (default: 30)
    """
    return dashboard_service.get_keyword_stats(db, limit, days)


@router.get("/trend")
def get_trend(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get sentiment trend chart data."""
    return dashboard_service.get_sentiment_trend(db, days)
