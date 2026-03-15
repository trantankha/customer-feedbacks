"""
MonitorTask model.
"""
import uuid
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy import func

from app.db.base import Base


class MonitorTask(Base):
    __tablename__ = "monitor_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Fields
    url = Column(String, nullable=False)
    platform = Column(String, nullable=False)  # FACEBOOK / TIKTOK / SHOPEE
    status = Column(String, default="ACTIVE")  # ACTIVE, PAUSED, ERROR
    memo = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_checked_at = Column(DateTime, nullable=True)
    last_comment_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    creator = relationship("User", backref="monitor_tasks")
