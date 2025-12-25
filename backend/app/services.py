# backend/app/services.py
from transformers import pipeline
from google import genai
from app.core import settings

GEMINI_API_KEY = settings.GEMINI_API_KEY

# --- KHỞI TẠO GEMINI CLIENT (NEW SDK) ---
try:
    if GEMINI_API_KEY:
        client = genai.Client(api_key=GEMINI_API_KEY)
        print("✅ Đã kết nối Google Gemini!")
    else:
        print("⚠️ Chưa có GEMINI_API_KEY, tính năng Chatbot sẽ bị tắt.")
        client = None
except Exception as e:
    print(f"❌ Lỗi khởi tạo Gemini Client: {e}")
    client = None

# --- KHỞI TẠO MODEL AI PHÂN TÍCH CẢM XÚC (PHOBERT) ---
print("⏳ Đang tải Model AI phân tích cảm xúc (PhoBERT)... Vui lòng chờ!")
try:
    # Sử dụng pipeline phân tích cảm xúc
    sentiment_pipeline = pipeline(
        "sentiment-analysis", 
        model="wonrax/phobert-base-vietnamese-sentiment" 
    )
    print("✅ Model PhoBERT đã sẵn sàng!")
except Exception as e:
    print(f"❌ Lỗi tải PhoBERT: {e}")
    sentiment_pipeline = None

# 1. TỪ ĐIỂN E-COMMERCE (Shopee - Giữ nguyên)
ECOMMERCE_KEYWORDS = {
    # Tích cực
    "giao nhanh": "giao hàng", "đóng gói kỹ": "đóng gói", 
    "chất lượng": "chất lượng", "rẻ": "giá cả", "đẹp": "hình thức",
    # Tiêu cực
    "chậm": "giao hàng", "vỡ": "đóng gói", "đắt": "giá cả", 
    "xấu": "hình thức", "lừa đảo": "uy tín"
}

# 2. TỪ ĐIỂN SOCIAL (Facebook - Tổng quát hơn)
SOCIAL_KEYWORDS = {
    # Cảm xúc / Quan điểm
    "đồng ý": "quan điểm", "ủng hộ": "quan điểm", "chuẩn": "đồng tình",
    "hay": "nội dung", "ý nghĩa": "nội dung", "xúc động": "cảm xúc",
    "tuyệt vời": "khen ngợi", "đỉnh": "khen ngợi", "xinh": "ngoại hình",
    
    # Tiêu cực / Tranh luận
    "phản đối": "tranh luận", "sai": "tranh luận", "tào lao": "chê bai",
    "nhảm": "nội dung", "xạo": "tin giả", "bịp": "tin giả",
    "chửi": "thái độ", "trẻ trâu": "cộng đồng", "ngáo": "cộng đồng",
    
    # Hành động
    "hóng": "tương tác", "chấm": "tương tác", "share": "chia sẻ"
}

def analyze_text(text: str, source: str = "OTHER"):
    """
    Phân tích cảm xúc sử dụng Deep Learning Model (PhoBERT) kết hợp trích xuất từ khóa.
    """
    if not text or str(text).strip() == "":
        return {"score": 0.0, "label": "NEUTRAL", "keywords": []}

    # Cắt ngắn text nếu quá dài (Model thường giới hạn 256-512 tokens)
    processed_text = text[:512] 

    # --- 1. GỌI AI MODEL ĐỂ LẤY CẢM XÚC CHÍNH ---
    ai_label = "NEUTRAL"
    ai_score = 0.5
    
    if sentiment_pipeline:
        try:
            # Model trả về dạng: [{'label': 'POS', 'score': 0.99}]
            result = sentiment_pipeline(processed_text)[0]
            
            label_map = {
                "POS": "POSITIVE",
                "NEG": "NEGATIVE",
                "NEU": "NEUTRAL"
            }
            ai_label = label_map.get(result['label'], "NEUTRAL")
            
            # Chuẩn hóa điểm số về thang -1 đến 1
            prob = result['score']
            if ai_label == "POSITIVE":
                ai_score = prob
            elif ai_label == "NEGATIVE":
                ai_score = -prob
            else:
                ai_score = 0.0
        except Exception as e:
            print(f"Lỗi khi chạy AI PhoBERT: {e}")
            pass
            
    # --- 2. DÙNG TỪ KHÓA ĐỂ TRÍCH XUẤT TAG ---
    text_lower = text.lower()
    found_keywords = []

    if source == "SHOPEE":
        target_dict = ECOMMERCE_KEYWORDS
    elif source == "FACEBOOK":
        target_dict = SOCIAL_KEYWORDS
    else:
        target_dict = {**ECOMMERCE_KEYWORDS, **SOCIAL_KEYWORDS}

    for word, tag in target_dict.items():
        if word in text_lower:
            if source == "FACEBOOK":
                found_keywords.append(tag) 
            else:
                found_keywords.append(f"{tag}")

    unique_keywords = list(set(found_keywords))[:4]

    return {
        "score": round(ai_score, 2),
        "label": ai_label,
        "keywords": unique_keywords
    }

def ask_gemini_about_data(question: str, context_data: list):
    """
    Gửi câu hỏi + Dữ liệu tóm tắt cho Gemini trả lời (New SDK)
    """
    if not client:
        return "Xin lỗi, kết nối AI đang gặp sự cố hoặc chưa cấu hình API Key."

    # 1. Chuẩn bị ngữ cảnh
    data_text = ""
    for item in context_data:
        data_text += f"- [{item['label']}] {item['content']}\n"

    # 2. Tạo Prompt
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
    - Dẫn chứng cụ thể.
    - Đề xuất giải pháp nếu cần.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"Lỗi khi hỏi Gemini: {e}"
    
def analyze_customer_persona(customer_name: str, history: list):
    """
    Dùng Gemini để dựng chân dung khách hàng (New SDK)
    """
    if not client:
        return "Lỗi kết nối AI."
    
    if not history:
        return "Khách hàng này chưa có đủ dữ liệu lịch sử để phân tích."

    history_text = ""
    for h in history:
        # Xử lý an toàn nếu history item thiếu trường
        date_str = h.get('date', 'N/A')
        source_str = h.get('source', 'Unknown')
        label_str = h.get('label', 'Unknown')
        content_str = h.get('content', '') or h.get('raw_content', '')
        
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
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"Lỗi khi gọi Gemini: {e}"