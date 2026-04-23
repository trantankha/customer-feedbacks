"""
Gemini service: AI chatbot and customer persona analysis.
"""
import json
import hashlib
import time
from google import genai

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# ==============================================
# INITIALIZE GEMINI CLIENT
# ==============================================
client = None

try:
    if settings.GEMINI_API_KEY:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.info("Gemini client connected successfully")
    else:
        logger.warning("GEMINI_API_KEY not set — chatbot features disabled")
except Exception as e:
    logger.error(f"Failed to initialize Gemini client: {e}")

# ==============================================
# KEYWORD CACHE
# Cache format: {text_hash: {"category": str, "keywords": list}}
# ==============================================
_keyword_cache = {}
CACHE_MAX_SIZE = 1000

def _get_text_hash(text: str) -> str:
    """Generate a hash for text to use as cache key."""
    return hashlib.md5(text.strip().lower().encode()).hexdigest()

def _cache_keywords(text_hash: str, result: dict):
    """Cache keywords with LRU eviction."""
    global _keyword_cache
    if len(_keyword_cache) >= CACHE_MAX_SIZE:
        # Remove oldest 10%
        keys_to_remove = list(_keyword_cache.keys())[:CACHE_MAX_SIZE // 10]
        for key in keys_to_remove:
            del _keyword_cache[key]
    _keyword_cache[text_hash] = result

def _get_cached_keywords(text_hash: str) -> dict | None:
    """Get cached keywords if available."""
    return _keyword_cache.get(text_hash)


def ask_gemini_about_data(question: str, context_data: list) -> str:
    """Ask Gemini a question about feedback data."""
    if not client:
        return "Xin lỗi, kết nối AI đang gặp sự cố hoặc chưa cấu hình API Key."

    data_text = ""
    for item in context_data:
        platform = item.get("platform", "Unknown")
        customer = item.get("customer_name", "Ẩn danh")
        received_at = item.get("received_at", "N/A")
        category = item.get("category", "Chưa xác định")
        keywords = ", ".join(item.get("keywords", []))
        label = item.get("label", "Unknown")
        content = item.get("content", "")
        
        data_text += f"- **Nền tảng:** {platform}\n"
        data_text += f"  **Khách hàng:** {customer}\n"
        data_text += f"  **Thời gian:** {received_at}\n"
        data_text += f"  **Danh mục:** {category}\n"
        if keywords:
            data_text += f"  **Từ khóa:** {keywords}\n"
        data_text += f"  **Thái độ:** {label}\n"
        data_text += f"  **Nội dung:** {content}\n\n"

    prompt = f"""
    Bạn là một trợ lý phân tích dữ liệu chuyên nghiệp (Data Analyst).
    Dưới đây là danh sách các phản hồi gần đây từ khách hàng:

    --- BẮT ĐẦU DỮ LIỆU ---
    {data_text}
    --- KẾT THÚC DỮ LIỆU ---

    Dựa vào dữ liệu trên, hãy trả lời câu hỏi sau:
    "{question}"

    Yêu cầu:
    - Trả lời ngắn gọn, đi thẳng vào vấn đề.
    - Dẫn chứng cụ thể (trích dẫn nội dung, nền tảng, khách hàng cụ thể).
    - Đề xuất giải pháp nếu cần.
    - Nếu câu hỏi yêu cầu dữ liệu không có trong context (ví dụ: so sánh nền tảng mà không có data của nền tảng đó), hãy nói rõ giới hạn này và đưa ra phân tích dựa trên data hiện có.
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=prompt
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            return "🔥 Cảnh báo: Hệ thống AI đang quá tải (bạn đã dùng hết hạn mức của Google Gemini). Vui lòng chờ một chút rồi thử lại nhé!"
        return f"Lỗi khi hỏi Gemini: {e}"


def analyze_customer_persona(customer_name: str, history: list) -> str:
    """Use Gemini to build a customer persona from interaction history."""
    if not client:
        return "Lỗi kết nối AI."

    if not history:
        return "Khách hàng này chưa có đủ dữ liệu lịch sử để phân tích."

    history_text = ""
    for h in history:
        date_str = h.get("date", "N/A")
        source_str = h.get("source", "Unknown")
        label_str = h.get("label", "Unknown")
        content_str = h.get("content", "") or h.get("raw_content", "")
        history_text += f"- [{date_str}] [{source_str}] ({label_str}): {content_str}\n"

    prompt = f"""
    Bạn là một chuyên gia CRM và Tâm lý hành vi khách hàng.
    Hãy phân tích khách hàng tên "{customer_name}" dựa trên lịch sử tương tác:

    --- LỊCH SỬ TƯƠNG TÁC ---
    {history_text}
    --- KẾT THÚC ---

    Hãy trả lời dưới dạng báo cáo ngắn gọn (Markdown):
    1. **Tính cách:**
    2. **Mối quan tâm chính:**
    3. **Đánh giá tiềm năng:**
    4. **Lời khuyên hành động:**
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=prompt
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            return "🔥 Không thể phân tích hồ sơ: Hệ thống AI đang quá tải (Hết hạn mức). Vui lòng thử lại sau."
        return f"Lỗi khi gọi Gemini: {e}"


def analyze_full_customer_profile(customer_name: str, history: list) -> dict:
    """Use Gemini to build a customer persona, predict churn, and suggest an action plan in one call."""
    default_result = {
        "insight": "🔥 Cảnh báo: Hệ thống AI đang quá tải (hoặc lỗi). Vui lòng thử lại sau.", 
        "probability": 0, 
        "action_plan": "Cảnh báo lỗi."
    }

    if not client:
        return {
            "insight": "Lỗi kết nối AI.",
            "probability": 0,
            "action_plan": "Hệ thống AI đang bận, không thể xuất kịch bản."
        }

    if not history:
        return {
            "insight": "Khách hàng này chưa có đủ dữ liệu lịch sử để phân tích.",
            "probability": 0,
            "action_plan": "Khách hàng này chưa có dữ liệu lịch sử để dự đoán."
        }

    history_text = ""
    for h in history:
        date_str = h.get("date", "N/A")
        source_str = h.get("source", "Unknown")
        label_str = h.get("label", "Unknown")
        content_str = h.get("content", "") or h.get("raw_content", "")
        history_text += f"- [{date_str}] [{source_str}] ({label_str}): {content_str}\n"

    prompt = f"""
    Bạn là một chuyên gia CRM, Tâm lý hành vi khách hàng và Phân tích Dự đoán Rời bỏ (Churn Prediction).
    Hãy phân tích khách hàng tên "{customer_name}" dựa trên danh sách các tương tác lịch sử sau:

    --- LỊCH SỬ TƯƠNG TÁC ---
    {history_text}
    --- KẾT THÚC ---

    Yêu cầu thực hiện 3 việc, dựa trên mức độ tích cực/tiêu cực, tính thường xuyên và độ lớn của lịch sử phản hồi:
    1. Insight cấu hình (1 đoạn Markdown format gồm: Tính cách, Mối quan tâm chính, Đánh giá tiềm năng, Lời khuyên chung). Giữ cho ngắn gọn.
    2. Dự đoán xác suất phần trăm (%) rời bỏ/ngừng mua hàng (Probability từ 0 đến 100).
    3. Đề xuất một "Kịch bản gọi điện thoại CSKH" tinh tế để xoa dịu/thuyết phục dựa theo insight trên. Trình bày bằng văn bản ngắn ngọn.

    TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON sau (ĐỪNG chứa markdown tag ```json):
    {{
      "insight": "1. **Tính cách:**...\\n2. **Mối quan tâm:**...\\n3. **Lời khuyên:**...",
      "churn_probability": 85,
      "action_plan": "Chào anh/chị..."
    }}
    Lưu ý phần insight và action_plan hãy escape markdown formatting cẩn thận để là JSON chuẩn.
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        parsed_data = json.loads(raw_text.strip())
        
        insight = parsed_data.get("insight", "Không trích xuất được insight.")
        prob = int(parsed_data.get("churn_probability", 0))
        action = parsed_data.get("action_plan", "Không có gợi ý.")
        
        return {
            "insight": insight,
            "probability": prob,
            "action_plan": action
        }
        
    except Exception as e:
        logger.error(f"Gemini full profile error: {e}")
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            return {
                "insight": "🔥 Không thể phân tích hồ sơ: Hệ thống AI đang quá tải (Hết hạn mức API). Vui lòng thử lại sau chút xíu.",
                "probability": 0,
                "action_plan": "🔥 AI đang quá tải."
            }
        return default_result




def verify_sentiment_with_gemini(text: str, phobert_label: str) -> str:
    """
    Use Gemini as a second opinion for sentiment classification.
    Called when PhoBERT confidence is below threshold.
    Returns: "POSITIVE", "NEGATIVE", or "NEUTRAL"
    
    Timeout: 5 seconds max - if Gemini unavailable, fallback to PhoBERT
    """
    if not client:
        return phobert_label  # Fallback to PhoBERT if Gemini unavailable

    prompt = f"""Phân loại cảm xúc của đoạn text sau thành ĐÚNG MỘT trong ba nhãn: POSITIVE, NEGATIVE, NEUTRAL.

Text: "{text[:500]}"

Chỉ trả lời ĐÚNG MỘT từ: POSITIVE hoặc NEGATIVE hoặc NEUTRAL. Không giải thích."""

    try:
        # Quick call - no retry for verification (just a second opinion)
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=prompt,
        )
        result = response.text.strip().upper()

        # Parse response — extract label
        for label in ["POSITIVE", "NEGATIVE", "NEUTRAL"]:
            if label in result:
                return label

        logger.warning(f"Gemini returned unexpected label: {result}")
        return phobert_label
        
    except Exception as e:
        # Don't retry for verification - just fallback to PhoBERT
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            logger.warning("Gemini rate limited - using PhoBERT label only")
        else:
            logger.debug(f"Gemini verify error (non-blocking): {e}")
        return phobert_label

def extract_categories_and_keywords(text: str) -> dict:
    """
    Extract a root cause category and dynamic keywords using Gemini returning JSON.
    Categories: Chua xac dinh, Chat luong, Gia ca, Van chuyen, Dich vu, Thai do, Khac
    Returns: {"category": str, "keywords": list[str]}
    
    Non-blocking: Returns empty keywords if Gemini unavailable (rate limit, etc.)
    """
    import time
    from httpx import HTTPStatusError
    
    default_result = {"category": "Chưa xác định", "keywords": []}

    if not client:
        logger.debug("Gemini client not initialized - skipping keyword extraction")
        return default_result
    
    if not text or str(text).strip() == "":
        return default_result

    # Check cache first
    text_hash = _get_text_hash(text)
    cached_result = _get_cached_keywords(text_hash)
    if cached_result:
        logger.debug(f"Cache hit for text hash: {text_hash[:8]}...")
        return cached_result
    
    logger.debug(f"Extracting keywords from text ({len(text)} chars)...")

    prompt = f"""Phân tích đoạn phản hồi hoặc bình luận sau:
"{text[:600]}"

Yêu cầu thực hiện 2 việc:
1. Xác định ĐÚNG MỘT nhóm "category" phản ánh đúng nhất tính chất của bình luận này, phải chọn LÀ MỘT TRONG CÁC TỪ KHOÁ SAU (không được tự bịa ra):
["Chất lượng", "Giá cả", "Vận chuyển", "Dịch vụ", "Thái độ", "Tích cực chung", "Tiêu cực chung", "Chương trình khuyến mãi", "Khác"]

2. Trích xuất ra tối đa 4 "keywords" (từ khóa) mang ý nghĩa nhất, mô tả chính xác vấn đề hoặc điểm nhấn trong câu. Hãy giữ nguyên từ lóng hoặc teencode nếu có.

Trả về kết quả ĐÚNG định dạng JSON sau (không chứa markdown markdown block ```json):
{{
  "category": "Tên thể loại",
  "keywords": ["từ 1", "từ 2"]
}}"""

    # Single attempt with no retry for non-blocking behavior
    # If rate limited, return empty keywords (not a critical error)
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        # Parse JSON from response
        raw_text = response.text.strip()

        # Remove markdown code block markers
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        parsed_data = json.loads(raw_text.strip())

        category = parsed_data.get("category", "Chưa xác định")
        valid_cats = ["Chất lượng", "Giá cả", "Vận chuyển", "Dịch vụ", "Thái độ", "Tích cực chung", "Tiêu cực chung", "Chương trình khuyến mãi", "Khác"]
        if category not in valid_cats:
            category = "Khác"

        keywords = parsed_data.get("keywords", [])
        if not isinstance(keywords, list):
            keywords = []
        
        result = {
            "category": category,
            "keywords": [str(k)[:30] for k in keywords][:4]
        }
        
        # Cache the result
        _cache_keywords(text_hash, result)
        logger.debug(f"Extracted keywords: {keywords}")
        
        return result

    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            logger.debug("Gemini rate limited - skipping keyword extraction (will retry next time)")
        else:
            logger.debug(f"Gemini keyword extraction error (non-blocking): {e}")
        return default_result


def predict_churn_and_script(customer_name: str, history: list) -> dict:
    """
    Use Gemini to predict churn probability and output action plan.
    Returns: {"probability": 85, "action_plan": "Markdown script..."}
    """
    default_result = {"probability": 0, "action_plan": "Hệ thống AI đang bận, không thể xuất kịch bản."}

    if not client:
        return default_result

    if not history:
        return {"probability": 0, "action_plan": "Khách hàng này chưa có dữ liệu lịch sử để dự đoán."}

    history_text = ""
    for h in history:
        date_str = h.get("date", "N/A")
        source_str = h.get("source", "Unknown")
        label_str = h.get("label", "Unknown")
        content_str = h.get("content", "") or h.get("raw_content", "")
        history_text += f"- [{date_str}] [{source_str}] ({label_str}): {content_str}\n"

    prompt = f"""
    Bạn là một chuyên gia Chăm sóc khách hàng và Phân tích Dữ liệu Dự đoán Rời bỏ (Churn Prediction).
    Dưới đây là lịch sử phản hồi của khách hàng tên "{customer_name}":

    --- LỊCH SỬ ---
    {history_text}
    --- KẾT THÚC ---

    Yêu cầu:
    Dựa vào mức độ chê khen, tính thường xuyên dần và độ nghiêm trọng của các đánh giá tiêu cực gần đây, hãy dự đoán phần trăm (%) khả năng người này sẽ KHÔNG MUA HÀNG NỮA (từ bỏ sản phẩm/dịch vụ). Tỉ lệ từ 0 đến 100.
    Sau đó, đưa ra một "Kịch bản gọi điện thoại CSKH" thực tế, khéo léo để xoa dịu và lôi kéo họ ở lại.

    TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON sau (ĐỪNG chứa markdown markdown block ```json):
    {{
      "probability": 85,
      "action_plan": "Nội dung lời gọi điện thoại..."
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        parsed_data = json.loads(raw_text.strip())
        
        prob = int(parsed_data.get("probability", 0))
        action = parsed_data.get("action_plan", "")
        
        return {
            "probability": prob,
            "action_plan": action
        }
        
    except Exception as e:
        logger.error(f"Gemini churn logic error: {e}")
        return default_result
