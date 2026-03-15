"""
Chat API endpoint.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models import User
from app.schemas.customer import ChatRequest
from app.services import feedback_service, gemini_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/ask")
def chat_with_data(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ask AI questions about feedback data."""
    recent_feedbacks = feedback_service.get_feedbacks(db, limit=20)

    context_data = []
    for f in recent_feedbacks:
        context_data.append({
            "content": f.raw_content,
            "label": f.analysis.sentiment_label if f.analysis else "Unknown",
        })

    answer = gemini_service.ask_gemini_about_data(payload.question, context_data)

    return {"answer": answer}
