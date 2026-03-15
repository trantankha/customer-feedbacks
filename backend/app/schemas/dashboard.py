"""
Dashboard schemas.
"""
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total: int
    sentiment_counts: dict
