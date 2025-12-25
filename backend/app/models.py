import uuid
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime,Float, ARRAY, Boolean
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy import func

# 1. Thêm bảng Source
class Source(Base):
    __tablename__ = "sources"
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    platform = Column(String, unique=True) # Đảm bảo không trùng platform

# 2. Thêm bảng Feedback
class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Thêm ForeignKey để liên kết chặt chẽ với bảng sources
    source_id = Column(Integer, ForeignKey("sources.id")) 
    raw_content = Column(Text, nullable=False)
    customer_info = Column(JSONB, default={})
    status = Column(String, default="PENDING")
    received_at = Column(DateTime, default=func.now()) # Thêm default time

    analysis = relationship("AnalysisResult", back_populates="feedback", uselist=False)

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feedback_id = Column(UUID(as_uuid=True), ForeignKey("feedbacks.id"))
    sentiment_score = Column(Float)
    sentiment_label = Column(String)
    keywords = Column(ARRAY(String))
    
    feedback = relationship("Feedback", back_populates="analysis")

class MonitorTask(Base):
    __tablename__ = "monitor_tasks"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    platform = Column(String) # FACEBOOK / TIKTOK
    status = Column(String, default="ACTIVE") # ACTIVE, PAUSED, ERROR
    memo = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_checked_at = Column(DateTime, nullable=True)
    last_comment_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
