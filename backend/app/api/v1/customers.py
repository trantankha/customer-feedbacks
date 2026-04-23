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
    """Analyze customer persona and predict churn with AI in one call."""
    history = customer_service.get_customer_history(db, payload.name)
    result = gemini_service.analyze_full_customer_profile(payload.name, history)

    return {
        "customer": payload.name,
        "history_count": len(history),
        "insight": result.get("insight", "Không có dữ liệu insight"),
        "probability": result.get("probability", 0),
        "action_plan": result.get("action_plan", "Không có gợi ý"),
    }


@router.get("/journey/{name}")
def get_customer_journey_api(
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the customer sentiment journey line data."""
    journey = customer_service.get_customer_journey(db, name)
    return {
        "customer": name,
        "journey": journey
    }

@router.post("/predict-churn")
def predict_customer_churn(
    payload: CustomerAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Predict customer churn using AI."""
    history = customer_service.get_customer_history(db, payload.name)
    result = gemini_service.predict_churn_and_script(payload.name, history)
    
    return {
        "customer": payload.name,
        "probability": result["probability"],
        "action_plan": result["action_plan"]
    }
