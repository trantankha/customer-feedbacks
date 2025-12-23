# backend/app/services.py
from transformers import pipeline
import google.generativeai as genai
import os

GEMINI_API_KEY = "AIzaSyDpozwCrmTJBhkas7m8tXuco1k-a_ai8zY"

try:
    genai.configure(api_key=GEMINI_API_KEY)
    # Dùng model Gemini 1.5 Flash cho nhanh và rẻ (hoặc gemini-pro)
    chat_model = genai.GenerativeModel('gemini-2.5-flash')
    print("✅ Đã kết nối Google Gemini!")
except Exception as e:
    print(f"❌ Lỗi kết nối Gemini: {e}")
    chat_model = None

# --- KHỞI TẠO MODEL AI (CHẠY 1 LẦN KHI START SERVER) ---
print("⏳ Đang tải Model AI phân tích cảm xúc (PhoBERT)... Vui lòng chờ!")
try:
    # Sử dụng pipeline phân tích cảm xúc
    sentiment_pipeline = pipeline(
        "sentiment-analysis", 
        model="wonrax/phobert-base-vietnamese-sentiment" 
    )
    print("✅ Model AI đã sẵn sàng!")
except Exception as e:
    print(f"❌ Lỗi tải Model: {e}")
    sentiment_pipeline = None

def analyze_text(text: str):
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
            # Nếu POS: điểm dương, NEG: điểm âm
            prob = result['score']
            if ai_label == "POSITIVE":
                ai_score = prob
            elif ai_label == "NEGATIVE":
                ai_score = -prob
            else:
                ai_score = 0.0
        except Exception as e:
            print(f"Lỗi khi chạy AI: {e}")
            # Fallback về logic cũ nếu AI lỗi
            pass
            
    # --- 2. DÙNG TỪ KHÓA ĐỂ TRÍCH XUẤT TAG (KHÔNG DÙNG ĐỂ CHẤM ĐIỂM NỮA) ---
    # Phần này giúp hiển thị lên UI: Khách khen/chê cái gì?
    text_lower = text.lower()
    found_keywords = []
    
    keywords_dict = {
        # Tích cực
        "giao nhanh": "giao hàng", "đóng gói kỹ": "đóng gói", 
        "chất lượng": "chất lượng", "rẻ": "giá cả", "đẹp": "hình thức",
        # Tiêu cực
        "chậm": "giao hàng", "vỡ": "đóng gói", "đắt": "giá cả", 
        "xấu": "hình thức", "lừa đảo": "uy tín", "thái độ": "phục vụ"
    }

    for word, tag in keywords_dict.items():
        if word in text_lower:
            # Logic đơn giản: Nếu label là POS thì tag là "Khen...", NEG là "Chê..."
            prefix = "khen" if ai_score > 0 else "chê" if ai_score < 0 else "về"
            found_keywords.append(f"{tag}") # Chỉ lưu tag (vd: giá cả, giao hàng)

    # Lọc trùng
    unique_keywords = list(set(found_keywords))[:4]

    return {
        "score": round(ai_score, 2),
        "label": ai_label,
        "keywords": unique_keywords
    }

def ask_gemini_about_data(question: str, context_data: list):
    """
    Gửi câu hỏi + Dữ liệu tóm tắt cho Gemini trả lời
    """
    if not chat_model:
        return "Xin lỗi, kết nối AI đang gặp sự cố."

    # 1. Chuẩn bị ngữ cảnh (Context)
    # Biến list feedback thành một đoạn văn bản
    data_text = ""
    for item in context_data:
        # Format: [Tích cực] Nội dung comment...
        data_text += f"- [{item['label']}] {item['content']}\n"

    # 2. Tạo Prompt (Câu lệnh cho AI)
    # Kỹ thuật: Role-playing (Nhập vai)
    prompt = f"""
    Bạn là một trợ lý phân tích dữ liệu chuyên nghiệp (Data Analyst).
    Dưới đây là danh sách các phản hồi gần đây từ khách hàng về sản phẩm/dịch vụ:
    
    --- BẮT ĐẦU DỮ LIỆU ---
    {data_text}
    --- KẾT THÚC DỮ LIỆU ---

    Dựa vào dữ liệu trên, hãy trả lời câu hỏi sau của người quản lý:
    "{question}"

    Yêu cầu:
    - Trả lời ngắn gọn, đi thẳng vào vấn đề.
    - Dẫn chứng cụ thể (ví dụ: "Có nhiều khách phàn nàn về...").
    - Đề xuất giải pháp nếu thấy vấn đề tiêu cực.
    - Trả lời bằng tiếng Việt tự nhiên.
    """

    try:
        # 3. Gọi Gemini
        response = chat_model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Lỗi khi hỏi Gemini: {e}"
    
def analyze_customer_persona(customer_name: str, history: list):
    """
    Dùng Gemini để dựng chân dung khách hàng
    """
    if not chat_model:
        return "Lỗi kết nối AI."
    
    if not history:
        return "Khách hàng này chưa có đủ dữ liệu lịch sử để phân tích."

    # Biến lịch sử thành văn bản
    history_text = ""
    for h in history:
        history_text += f"- [{h['date']}] [{h['source']}] ({h['label']}): {h['content']}\n"

    # Prompt "bá đạo" để AI đóng vai chuyên gia tâm lý khách hàng
    prompt = f"""
    Bạn là một chuyên gia CRM và Tâm lý hành vi khách hàng (Customer Behavioral Analyst).
    Hãy phân tích khách hàng tên "{customer_name}" dựa trên lịch sử tương tác dưới đây:

    --- LỊCH SỬ TƯƠNG TÁC ---
    {history_text}
    --- KẾT THÚC ---

    Hãy trả lời dưới dạng báo cáo ngắn gọn (Markdown) gồm các mục sau:
    1. **Tính cách:** (Ví dụ: Dễ tính, Hay soi mói, Thích đùa, Fan cuồng, Cục súc...)
    2. **Mối quan tâm chính:** (Họ hay nói về Giá cả? Ship? hay Chất lượng?)
    3. **Đánh giá tiềm năng:** (Có nên chăm sóc kỹ không? Hay là khách bom hàng?)
    4. **Lời khuyên hành động:** (Shop nên làm gì với người này? Tặng mã giảm giá hay Block?)

    *Lưu ý: Giọng văn chuyên nghiệp nhưng sắc sảo, đi thẳng vào vấn đề.*
    """

    try:
        response = chat_model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Lỗi khi gọi Gemini: {e}"