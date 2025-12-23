from pydantic import BaseModel
from typing import List, Optional, Any
from uuid import UUID

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
    customer_info: Any
    status: str
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
    source: str
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
    
# Schema cho danh sách gửi lên
class ScrapeBatchRequest(BaseModel):
    url: str # Link bài viết gốc
    items: List[ScrapedItem]
