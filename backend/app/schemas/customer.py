"""
Customer schemas.
"""
from pydantic import BaseModel
from typing import List
from uuid import UUID

class CustomerProfile(BaseModel):
    name: str
    source_id: UUID
    total_comments: int
    positive_ratio: float
    avg_score: float
    last_interaction: str
    sentiment_trend: str


class PaginatedCustomerResponse(BaseModel):
    customers: List[CustomerProfile]
    total_count: int
    total_pages: int
    current_page: int
    per_page: int


class CustomerAnalyzeRequest(BaseModel):
    name: str


class ChatRequest(BaseModel):
    question: str
