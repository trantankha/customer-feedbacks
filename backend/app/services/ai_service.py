"""
AI service: PhoBERT sentiment analysis + keyword extraction.
"""
from app.core.logging import get_logger

logger = get_logger(__name__)

# Confidence threshold — below this, predictions are flagged for review
CONFIDENCE_THRESHOLD = 0.70

# ==============================================
# INITIALIZE PHOBERT MODEL
# ==============================================
sentiment_pipeline = None

try:
    logger.info("Loading PhoBERT sentiment analysis model...")
    from transformers import pipeline

    sentiment_pipeline = pipeline(
        "sentiment-analysis",
        model="wonrax/phobert-base-vietnamese-sentiment",
    )
    logger.info("PhoBERT model ready!")
except Exception as e:
    logger.error(f"Failed to load PhoBERT: {e}")


# ==============================================
# REMOVED HARDCODED DICTIONARIES
# We now use Gemini for dynamic keyword and category extraction.
# ==============================================


def analyze_text(text: str, source: str = "OTHER") -> dict:
    """
    Analyze sentiment using PhoBERT and extract keywords.
    Returns: {"score": float, "label": str, "keywords": list, "confidence": float, "needs_review": bool}
    """
    if not text or str(text).strip() == "":
        return {"score": 0.0, "label": "NEUTRAL", "keywords": [], "confidence": 0.0, "needs_review": False}

    processed_text = text[:512]

    # 1. AI sentiment analysis
    ai_label = "NEUTRAL"
    ai_score = 0.5
    confidence = 0.0

    if sentiment_pipeline:
        try:
            result = sentiment_pipeline(processed_text)[0]
            label_map = {"POS": "POSITIVE", "NEG": "NEGATIVE", "NEU": "NEUTRAL"}
            ai_label = label_map.get(result["label"], "NEUTRAL")

            prob = result["score"]
            confidence = round(prob, 4)

            if ai_label == "POSITIVE":
                ai_score = prob
            elif ai_label == "NEGATIVE":
                ai_score = -prob
            else:
                ai_score = 0.0
        except Exception as e:
            logger.error(f"PhoBERT analysis error: {e}")

    # 2. Extract Category and Dynamic Keywords via Gemini
    from app.services.gemini_service import extract_categories_and_keywords
    gemini_data = extract_categories_and_keywords(text)
    
    category = gemini_data.get("category", "Chưa xác định")
    unique_keywords = gemini_data.get("keywords", [])

    # 3. Flag for review if confidence is low
    needs_review = confidence < CONFIDENCE_THRESHOLD and confidence > 0.0

    return {
        "score": round(ai_score, 2),
        "label": ai_label,
        "keywords": unique_keywords,
        "category": category,
        "confidence": confidence,
        "needs_review": needs_review,
    }
