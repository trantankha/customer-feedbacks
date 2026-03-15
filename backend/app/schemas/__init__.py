"""
Schemas package – re-exports all schemas.
"""
from app.schemas.auth import (
    UserCreate, UserLogin, TokenResponse, UserResponse,
    UserUpdate, ChangePasswordRequest, RefreshTokenRequest,
)
from app.schemas.feedback import (
    AnalysisBase, FeedbackResponse, AnalysisUpdate,
    ScrapedItem, ScrapeBatchRequest, ReviewQueueResponse,
)
from app.schemas.dashboard import DashboardStats
from app.schemas.customer import (
    CustomerProfile, PaginatedCustomerResponse,
    CustomerAnalyzeRequest, ChatRequest,
)
from app.schemas.monitor import MonitorTaskCreate, MonitorTaskResponse
from app.schemas.source import SourceResponse

__all__ = [
    "UserCreate", "UserLogin", "TokenResponse", "UserResponse",
    "UserUpdate", "ChangePasswordRequest", "RefreshTokenRequest",
    "AnalysisBase", "FeedbackResponse", "AnalysisUpdate",
    "ScrapedItem", "ScrapeBatchRequest", "ReviewQueueResponse",
    "DashboardStats",
    "CustomerProfile", "PaginatedCustomerResponse",
    "CustomerAnalyzeRequest", "ChatRequest",
    "MonitorTaskCreate", "MonitorTaskResponse",
    "SourceResponse",
]
