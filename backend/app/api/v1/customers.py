"""
Customer API endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models import User
from app.schemas.customer import CustomerAnalyzeRequest, PaginatedCustomerResponse
from app.services import customer_service, gemini_service

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=PaginatedCustomerResponse)
def read_customers(
    page: int = 1,
    per_page: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get customer profiles with pagination."""
    skip = (page - 1) * per_page
    customers, total_count = customer_service.get_customer_profiles(
        db, skip=skip, limit=per_page
    )
    total_pages = (total_count + per_page - 1) // per_page

    return {
        "customers": customers,
        "total_count": total_count,
        "total_pages": total_pages,
        "current_page": page,
        "per_page": per_page,
    }


@router.post("/analyze-profile")
def analyze_customer(
    payload: CustomerAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze customer persona with AI."""
    history = customer_service.get_customer_history(db, payload.name)
    insight = gemini_service.analyze_customer_persona(payload.name, history)

    return {
        "customer": payload.name,
        "history_count": len(history),
        "insight": insight,
    }
