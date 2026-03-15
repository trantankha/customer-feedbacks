"""
Source API endpoints.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.source import SourceResponse
from app.services import source_service

router = APIRouter(prefix="/sources", tags=["Sources"])


@router.get("", response_model=List[SourceResponse])
def get_sources(db: Session = Depends(get_db)):
    """Get list of available sources (public)."""
    return source_service.get_sources(db)
