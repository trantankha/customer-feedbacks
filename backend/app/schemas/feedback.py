"""
Feedback schemas.
"""
from pydantic import BaseModel
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime


class AnalysisBase(BaseModel):
    id: UUID
    sentiment_score: float
    sentiment_label: str
    category: Optional[str] = None
    keywords: Optional[List[str]] = []
    confidence: Optional[float] = None
    is_manual_override: bool = False
    gemini_label: Optional[str] = None

    model_config = {"from_attributes": True}


class FeedbackResponse(BaseModel):
    id: UUID
    raw_content: str
    source_id: Optional[UUID] = None
    customer_info: Any
    status: str
    received_at: datetime
    analysis: Optional[AnalysisBase] = None
    created_by: Optional[UUID] = None

    model_config = {"from_attributes": True}


class AnalysisUpdate(BaseModel):
    sentiment_label: str


class ReviewQueueResponse(BaseModel):
    feedbacks: List[FeedbackResponse]
    total_count: int
    current_page: int
    per_page: int


class ScrapedItem(BaseModel):
    content: str
    source_platform: str
    author_name: Optional[str] = "Anonymous"
    likes: Optional[int] = 0
    created_at: Optional[str] = None
    original_timestamp: Optional[str] = None


class ScrapeBatchRequest(BaseModel):
    url: str
    items: List[ScrapedItem]
