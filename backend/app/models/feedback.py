"""
Feedback and AnalysisResult models.
"""
import uuid
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, DateTime, Float, ARRAY
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy import func

from app.db.base import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Fields
    raw_content = Column(Text, nullable=False)
    customer_info = Column(JSONB, default={})
    status = Column(String, default="PENDING")
    received_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    source = relationship("Source", back_populates="feedbacks")
    analysis = relationship("AnalysisResult", back_populates="feedback", uselist=False)
    creator = relationship("User", back_populates="feedbacks")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    feedback_id = Column(
        UUID(as_uuid=True), ForeignKey("feedbacks.id"), unique=True, nullable=False
    )

    # Fields
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String, nullable=True)
    category = Column(String, nullable=True) # Root cause category (e.g., Shipping, Quality, Service)
    keywords = Column(ARRAY(String), default=[])
    confidence = Column(Float, nullable=True)  # Raw probability from PhoBERT (0.0-1.0)
    is_manual_override = Column(Boolean, default=False, nullable=False)
    gemini_label = Column(String, nullable=True)  # Gemini's second opinion

    # Relationships
    feedback = relationship("Feedback", back_populates="analysis")
