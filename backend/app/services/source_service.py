"""
Source service: Source CRUD operations.
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Source


def get_sources(db: Session) -> List[Source]:
    return db.query(Source).all()


def get_source_by_id(db: Session, source_id: UUID) -> Optional[Source]:
    return db.query(Source).filter(Source.id == source_id).first()


def get_source_by_platform(db: Session, platform: str) -> Optional[Source]:
    return db.query(Source).filter(Source.platform == platform.upper()).first()


def create_source(db: Session, name: str, platform: str) -> Source:
    db_source = Source(name=name, platform=platform.upper())
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    return db_source
