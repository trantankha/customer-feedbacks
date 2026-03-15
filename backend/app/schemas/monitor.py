"""
Monitor task schemas.
"""
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class MonitorTaskCreate(BaseModel):
    url: str
    memo: Optional[str] = None
    platform: str = "OTHER"


class MonitorTaskResponse(BaseModel):
    id: UUID
    url: str
    memo: Optional[str]
    platform: str
    is_active: bool
    status: str
    last_checked_at: Optional[datetime]
    last_comment_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
