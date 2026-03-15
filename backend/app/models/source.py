"""
Source model.
"""
import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    platform = Column(String, unique=True, nullable=False)

    # Relationships
    feedbacks = relationship("Feedback", back_populates="source")
