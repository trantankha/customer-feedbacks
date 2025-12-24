import pandas as pd
from io import BytesIO
from sqlalchemy.orm import Session
from app import models
from sqlalchemy import func
from collections import Counter
from datetime import datetime
from datetime import timedelta

# --- 1. TỪ ĐIỂN MAPPING (CẬP NHẬT THEO FILE THỰC TẾ) ---
PLATFORM_MAPPING = {
    'SHOPEE': {
        # f35Wh2: Mã hóa của nội dung comment Shopee
        'content_cols': ['YNedDV', 'content', 'comment', 'shopee-product-rating__content'],
        'author_cols': ['InK5kS', 'author', 'name', 'shopee-product-rating__author-name'],
        'time_cols': ['XYk98l', 'time', 'date', 'shopee-product-rating__time'],
        'likes_cols': ['shopee-product-rating__like-count', 'like']
    },
    'FACEBOOK': {
        # xdj266r: Mã hóa của nội dung comment Facebook
        'content_cols': ['xdj266r', 'content', 'message', 'text'],
        'author_cols': ['x193iq5w', 'author', 'name', 'user'],
        'time_cols': ['x1i10hfl', 'time', 'date'],
        'likes_cols': ['html-span', 'likes', 'reaction']
    },
    'OTHER': {
        'content_cols': ['content', 'comment', 'review', 'text', 'noidung', 'feedback'],
        'author_cols': ['user', 'name', 'author', 'khachhang'],
        'time_cols': ['time', 'date', 'ngay'],
        'likes_cols': ['like', 'thich']
    }
}

# --- 2. HÀM TRỢ GIÚP TÌM CỘT ---
def find_column(df_columns, possible_names):
    """Tìm tên cột trong CSV khớp với cấu hình"""
    df_cols_lower = {col.lower().strip(): col for col in df_columns}
    
    for name in possible_names:
        name_lower = name.lower()
        if name_lower in df_cols_lower:
            return df_cols_lower[name_lower]
            
    return None

# --- 3. HÀM TẠO FEEDBACK (Tách ra để tái sử dụng) ---
def create_feedback_with_analysis(db: Session, content: str, source_id: int = 3, custom_time: datetime = None):
    from app import services # Import ở đây để tránh circular import
    """
    Tạo Feedback. Nếu có custom_time (từ Extension) thì dùng, 
    nếu không thì để Database tự lấy giờ hiện tại.
    """
    db_feedback = models.Feedback(
        raw_content=content,
        source_id=source_id,
        status="PROCESSED"
    )

    # 👇 LOGIC QUAN TRỌNG: Ghi đè thời gian
    if custom_time:
        db_feedback.received_at = custom_time
        
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)

    # ... (Phần gọi AI giữ nguyên không đổi) ...
    source_name = "OTHER"
    if source_id == 1: source_name = "FACEBOOK"
    elif source_id == 2: source_name = "SHOPEE"
    
    ai_result = services.analyze_text(content, source=source_name)
    
    db_analysis = models.AnalysisResult(
        feedback_id=db_feedback.id,
        sentiment_score=ai_result['score'],
        sentiment_label=ai_result['label'],
        keywords=ai_result['keywords']
    )
    db.add(db_analysis)
    db.commit()
    
    return db_feedback

# --- 4. HÀM XỬ LÝ CSV ---
def process_csv_upload(db: Session, file_contents: bytes, platform: str = 'OTHER'):
    try:
        # Đọc file CSV
        df = pd.read_csv(BytesIO(file_contents))
        
        # Lấy cấu hình mapping
        config = PLATFORM_MAPPING.get(platform.upper(), PLATFORM_MAPPING['OTHER'])
        
        # Tìm cột nội dung (Bắt buộc phải có)
        content_col = find_column(df.columns, config['content_cols'])
        
        if not content_col:
            print(f"❌ [Platform: {platform}] Không tìm thấy cột nội dung. Cột hiện có: {list(df.columns)}")
            return

        print(f"🚀 [{platform}] Đã map cột '{content_col}' là nội dung. Bắt đầu xử lý...")
        
        # Tìm các cột phụ (Metadata)
        author_col = find_column(df.columns, config['author_cols'])
        time_col = find_column(df.columns, config['time_cols'])
        likes_col = find_column(df.columns, config['likes_cols'])

        count = 0
        for _, row in df.iterrows():
            raw_text = row[content_col]
            
            # Bỏ qua dòng trống
            if pd.isna(raw_text) or str(raw_text).strip() == "":
                continue
                
            text = str(raw_text)
            
            # Gom thông tin phụ vào JSON
            customer_meta = {"imported_from": platform}
            
            if author_col and pd.notna(row[author_col]): 
                customer_meta['name'] = str(row[author_col])
                
            if time_col and pd.notna(row[time_col]):
                # Shopee hay có kiểu "2023-08-20 | Phân loại...", ta chỉ lấy ngày giờ đầu
                time_val = str(row[time_col])
                if platform == 'SHOPEE' and '|' in time_val:
                    time_val = time_val.split('|')[0].strip()
                customer_meta['time_posted'] = time_val
                
            if likes_col and pd.notna(row[likes_col]):
                customer_meta['likes'] = str(row[likes_col])

            # Lưu vào DB
            try:
                src_id = 3 # Mặc định là Other
                
                if platform == 'FACEBOOK':
                    src_id = 1
                elif platform == 'SHOPEE':
                    src_id = 2
                
                # Gọi hàm tạo
                db_feedback = create_feedback_with_analysis(db, text, source_id=src_id)
                
                # Update metadata
                db_feedback.customer_info = customer_meta
                db.commit()
                
                count += 1
            except Exception as e:
                print(f"⚠️ Lỗi dòng: {e}")
                continue

        print(f"✅ Đã xử lý xong {count} dòng dữ liệu từ {platform}.")

    except Exception as e:
        print(f"❌ Lỗi đọc file CSV: {e}")

# --- Các hàm CRUD khác giữ nguyên ---
def get_feedbacks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Feedback).order_by(models.Feedback.received_at.desc()).offset(skip).limit(limit).all()

def get_stats(db: Session):
    total = db.query(models.Feedback).count()
    rows = db.query(
        models.AnalysisResult.sentiment_label, 
        func.count(models.AnalysisResult.sentiment_label)
    ).group_by(models.AnalysisResult.sentiment_label).all()
    
    return {
        "total": total,
        "sentiment_counts": {r[0]: r[1] for r in rows}
    }

def get_keyword_stats(db: Session, limit: int = 50):
    """
    Lấy danh sách từ khóa xuất hiện nhiều nhất để vẽ Word Cloud
    """
    # 1. Lấy toàn bộ cột keywords từ bảng AnalysisResult
    # Chỉ lấy các dòng có keywords (không null)
    results = db.query(models.AnalysisResult.keywords)\
                .filter(models.AnalysisResult.keywords != None).all()
    
    # 2. Làm phẳng list (Flatten): [[a, b], [b, c]] -> [a, b, b, c]
    all_keywords = []
    for row in results:
        # row là tuple, row[0] là list keywords
        if row[0]: 
            all_keywords.extend(row[0])
            
    # 3. Đếm số lần xuất hiện
    counter = Counter(all_keywords)
    
    # 4. Lấy top keywords phổ biến nhất
    most_common = counter.most_common(limit)
    
    # 5. Format lại theo chuẩn Frontend cần: { value: 'từ khóa', count: 10 }
    return [{"value": word, "count": count} for word, count in most_common]

def update_analysis_result(db: Session, feedback_id: str, new_label: str):
    # 1. Tìm bản ghi AnalysisResult dựa trên feedback_id
    analysis = db.query(models.AnalysisResult).filter(
        models.AnalysisResult.feedback_id == feedback_id
    ).first()
    
    if not analysis:
        return None
        
    # 2. Cập nhật nhãn mới
    analysis.sentiment_label = new_label
    
    # 3. Cập nhật lại điểm số (Score) cho khớp logic (Optional)
    # Nếu sửa thành POSITIVE thì set điểm là 0.9, NEGATIVE là -0.9
    if new_label == "POSITIVE":
        analysis.sentiment_score = 0.9
    elif new_label == "NEGATIVE":
        analysis.sentiment_score = -0.9
    else:
        analysis.sentiment_score = 0.0
        
    db.commit()
    db.refresh(analysis)
    return analysis

def get_customer_profiles(db: Session, skip: int = 0, limit: int = 10):
    # 1. Lấy toàn bộ dữ liệu (chỉ lấy các cột cần thiết cho nhẹ)
    feedbacks = db.query(models.Feedback).all()

    if not feedbacks:
        return [], 0

    # 2. Chuyển sang Pandas DataFrame
    data = []
    for f in feedbacks:
        # Lấy tên khách hàng an toàn
        name = "Anonymous"
        if f.customer_info and "name" in f.customer_info:
            name = f.customer_info["name"]

        data.append({
            "name": name,
            "source_id": f.source_id,
            "score": f.analysis.sentiment_score if f.analysis else 0,
            "label": f.analysis.sentiment_label if f.analysis else "NEUTRAL",
            "date": f.received_at
        })

    df = pd.DataFrame(data)

    # 3. Gom nhóm theo Tên (Group By)
    profiles = []
    # Group by Name và Source (để tránh trùng tên nhưng khác nguồn)
    grouped = df.groupby(['name', 'source_id'])

    for (name, source_id), group in grouped:
        total = len(group)
        # Tính tỷ lệ tích cực
        pos_count = len(group[group['label'] == 'POSITIVE'])
        pos_ratio = round(pos_count / total, 2)

        # Tính điểm trung bình
        avg_score = round(group['score'].mean(), 2)

        # Đánh giá xu hướng
        if avg_score > 0.5: trend = "Fan cứng"
        elif avg_score < -0.3: trend = "Khó tính"
        else: trend = "Trung lập"

        profiles.append({
            "name": name,
            "source_id": source_id,
            "total_comments": total,
            "positive_ratio": pos_ratio,
            "avg_score": avg_score,
            "last_interaction": str(group['date'].max()), # Lần cuối xuất hiện
            "sentiment_trend": trend
        })

    # Sắp xếp: Ai comment nhiều nhất lên đầu
    profiles.sort(key=lambda x: x['total_comments'], reverse=True)

    # 4. Áp dụng pagination
    total_count = len(profiles)
    paginated_profiles = profiles[skip:skip + limit]

    return paginated_profiles, total_count

def get_customer_history(db: Session, customer_name: str, limit: int = 20):
    """
    Lấy lịch sử comment của một khách hàng cụ thể (dựa trên tên).
    Lấy tối đa 50 comment gần nhất để tiết kiệm token cho AI.
    """
    # Vì JSONB lưu trữ linh động, ta dùng filter trên field customer_info
    # Lưu ý: Cách query JSONB có thể khác nhau tùy version Postgres, 
    # cách đơn giản nhất là lấy hết rồi filter Python (với dữ liệu nhỏ <100k dòng)
    # Cách tối ưu hơn là dùng SQL operator ->>
    
    # Cách an toàn cho đồ án (Filter Python):
    all_feedbacks = db.query(models.Feedback).order_by(models.Feedback.received_at.desc()).all()
    
    history = []
    for f in all_feedbacks:
        if f.customer_info and f.customer_info.get("name") == customer_name:
            history.append({
                "content": f.raw_content,
                "date": str(f.received_at),
                "source": f.customer_info.get("imported_from"),
                "label": f.analysis.sentiment_label if f.analysis else "Unknown"
            })
            if len(history) >= limit:
                break
    return history

def get_sentiment_trend(db: Session, days: int = 7):
    """
    Thống kê xu hướng (Tối ưu hóa + Xử lý ngày trống)
    """
    # 1. Xác định khung thời gian
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days - 1) # Lấy đủ range
    
    # 2. Query dữ liệu thô (Chỉ lấy cột cần thiết cho nhẹ)
    # Lọc các bản ghi trong khoảng thời gian
    feedbacks = db.query(models.Feedback.received_at, models.AnalysisResult.sentiment_label)\
        .join(models.AnalysisResult)\
        .filter(models.Feedback.received_at >= start_date)\
        .all()
    
    # 3. Tạo khung xương ngày tháng đầy đủ (Full Date Range)
    # Để đảm bảo ngày nào cũng hiển thị, kể cả ngày không có comment
    idx = pd.date_range(start=start_date, end=end_date, freq='D').normalize()
    
    # Chuẩn bị cấu trúc dữ liệu mặc định (toàn số 0)
    final_data = {
        "dates": idx.strftime('%d/%m').tolist(),
        "positive": [0] * len(idx),
        "negative": [0] * len(idx),
        "neutral": [0] * len(idx)
    }

    if not feedbacks:
        return final_data

    # 4. Xử lý dữ liệu bằng Pandas
    try:
        data = [{"date": f.received_at, "label": f.sentiment_label} for f in feedbacks]
        df = pd.DataFrame(data)
        
        # Convert sang datetime và bỏ phần giờ phút (normalize) để group theo ngày
        df['date'] = pd.to_datetime(df['date']).dt.normalize()
        
        # Gom nhóm: Đếm số lượng theo Ngày + Nhãn
        # size() đếm số dòng, unstack(fill_value=0) để xoay bảng và điền 0 vào ô trống
        grouped = df.groupby(['date', 'label']).size().unstack(fill_value=0)
        
        # Reindex: Ép bảng dữ liệu phải khớp với khung xương idx đã tạo ở bước 3
        # fill_value=0: Nếu ngày đó trong DB không có, điền số 0
        grouped = grouped.reindex(idx, fill_value=0)
        
        # 5. Trích xuất dữ liệu an toàn
        # Kiểm tra xem cột có tồn tại không, nếu không thì lấy mảng 0
        if 'POSITIVE' in grouped.columns:
            final_data['positive'] = grouped['POSITIVE'].tolist()
            
        if 'NEGATIVE' in grouped.columns:
            final_data['negative'] = grouped['NEGATIVE'].tolist()
            
        if 'NEUTRAL' in grouped.columns:
            final_data['neutral'] = grouped['NEUTRAL'].tolist()
            
    except Exception as e:
        print(f"⚠️ Lỗi xử lý biểu đồ: {e}")
        # Nếu lỗi vẫn trả về data rỗng để frontend không chết
        return final_data

    return final_data