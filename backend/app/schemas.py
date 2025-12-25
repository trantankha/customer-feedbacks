from pydantic import BaseModel
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime

# DTO cho kết quả phân tích
class AnalysisBase(BaseModel):
    sentiment_score: float
    sentiment_label: str
    keywords: Optional[List[str]] = []
    class Config:
        from_attributes = True # Pydantic v2 dùng cái này thay cho orm_mode

# DTO trả về cho Client
class FeedbackResponse(BaseModel):
    id: UUID
    raw_content: str
    source_id: int
    customer_info: Any
    status: str
    received_at: Optional[datetime] = None
    analysis: Optional[AnalysisBase] = None
    class Config:
        from_attributes = True

# DTO cho Dashboard
class DashboardStats(BaseModel):
    total: int
    sentiment_counts: dict

class AnalysisUpdate(BaseModel):
    sentiment_label: str

class CustomerProfile(BaseModel):
    name: str
    source_id: int
    total_comments: int
    positive_ratio: float # Tỷ lệ tích cực (0.0 -> 1.0)
    avg_score: float
    last_interaction: str
    sentiment_trend: str # "Tích cực", "Tiêu cực", "Thất thường"

class PaginatedCustomerResponse(BaseModel):
    customers: List[CustomerProfile]
    total_count: int
    total_pages: int
    current_page: int
    per_page: int

# Schema cho một item cào được
class ScrapedItem(BaseModel):
    content: str
    source_platform: str # "FACEBOOK" hoặc "SHOPEE"
    author_name: Optional[str] = "Anonymous"
    likes: Optional[int] = 0
    created_at: Optional[str] = None
    original_timestamp: Optional[str] = None
    
# Schema cho danh sách gửi lên
class ScrapeBatchRequest(BaseModel):
    url: str # Link bài viết gốc
    items: List[ScrapedItem]

class MonitorTaskCreate(BaseModel):
    url: str
    memo: Optional[str] = None
    platform: str = "OTHER"

class MonitorTaskResponse(BaseModel):
    id: int
    url: str
    memo: Optional[str]
    platform: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True