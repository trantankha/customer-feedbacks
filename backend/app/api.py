from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas, database, services, models
from fastapi import File, UploadFile, BackgroundTasks
from fastapi import Form
from datetime import datetime
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dateutil import parser
import pandas as pd
import os

class ChatRequest(BaseModel):
    question: str

class CustomerAnalyzeRequest(BaseModel):
    name: str

class MonitorRequest(BaseModel):
    url: str
    platform: str

router = APIRouter()

@router.get("/feedbacks", response_model=List[schemas.FeedbackResponse])
def read_feedbacks(skip: int = 0, limit: int = 10, db: Session = Depends(database.get_db)):
    return crud.get_feedbacks(db, skip, limit)

@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
def read_stats(db: Session = Depends(database.get_db)):
    return crud.get_stats(db)

# API test nhập dữ liệu nhanh
@router.post("/feedbacks/test-create")
def test_create_feedback(content: str, db: Session = Depends(database.get_db)):
    return crud.create_feedback_with_analysis(db, content)

@router.post("/feedbacks/upload-csv")
async def upload_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    platform: str = Form(...),
    db: Session = Depends(database.get_db)
):
    contents = await file.read()
    # Truyền platform vào hàm xử lý
    background_tasks.add_task(crud.process_csv_upload, db, contents, platform)
    
    return {
        "message": f"Đang xử lý file {platform}...",
        "filename": file.filename
    }

@router.get("/dashboard/keywords")
def read_keywords(db: Session = Depends(database.get_db)):
    return crud.get_keyword_stats(db)

@router.put("/feedbacks/{feedback_id}/analysis")
def update_feedback_analysis(
    feedback_id: str, 
    payload: schemas.AnalysisUpdate, 
    db: Session = Depends(database.get_db)
):
    result = crud.update_analysis_result(db, feedback_id, payload.sentiment_label)
    if not result:
        raise HTTPException(status_code=404, detail="Không tìm thấy Feedback")
    return {"message": "Cập nhật thành công", "data": result}

@router.get("/feedbacks/export")
def export_feedbacks(db: Session = Depends(database.get_db)):
    # 0. Lấy danh sách nguồn đã cấu hình
    sources = db.query(models.Source).all()
    source_map = {s.id: s.name for s in sources}

    # 1. Lấy dữ liệu từ DB (kèm kết quả phân tích)
    feedbacks = crud.get_feedbacks(db, limit=1000) # Lấy tối đa 10k dòng
    
    # 2. Chuyển đổi sang list dict để đưa vào Pandas
    data = []
    for f in feedbacks:
        # Xử lý Logic Nguồn
        source_name = f.customer_info.get("imported_from") if f.customer_info else "Unknown"
        
        # Nếu có source_id hợp lệ (1, 2, 3) thì lấy tên cấu hình
        if f.source_id and f.source_id in source_map and f.source_id in [1, 2, 3]:
            source_name = source_map[f.source_id]

        # Flatten dữ liệu (làm phẳng)
        item = {
            "ID": str(f.id),
            "Nguồn": source_name,
            "Thời gian": f.customer_info.get("original_timestamp") if f.customer_info else "",
            "Nội dung gốc": f.raw_content,
            "Người gửi": f.customer_info.get("name") if f.customer_info else "",
            "Likes": f.customer_info.get("likes") if f.customer_info else 0,
            "Cảm xúc (AI)": f.analysis.sentiment_label if f.analysis else "N/A",
            "Điểm số": f.analysis.sentiment_score if f.analysis else 0,
            "Từ khóa": ", ".join(f.analysis.keywords) if f.analysis and f.analysis.keywords else ""
        }
        data.append(item)
    
    # 3. Tạo DataFrame
    df = pd.DataFrame(data)
    
    # 4. Ghi ra file Excel tạm
    filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    filepath = os.path.join("tmp", filename) # Lưu vào thư mục tmp trong backend
    
    # Dùng engine openpyxl để ghi
    os.makedirs("tmp", exist_ok=True) # Ensure tmp dir exists
    df.to_excel(filepath, index=False, engine='openpyxl')
    
    # 5. Trả về file cho trình duyệt tải xuống
    return FileResponse(
        path=filepath, 
        filename=filename, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@router.post("/chat/ask")
def chat_with_data(payload: ChatRequest, db: Session = Depends(database.get_db)):
    # 1. Lấy dữ liệu mới nhất từ DB để làm ngữ cảnh
    # Lấy 50 comment mới nhất (Gemini Flash xử lý được cả ngàn comment, nhưng test 50 cho nhanh)
    recent_feedbacks = crud.get_feedbacks(db, limit=20)
    
    # 2. Chế biến dữ liệu gọn nhẹ để tiết kiệm token
    context_data = []
    for f in recent_feedbacks:
        context_data.append({
            "content": f.raw_content,
            "label": f.analysis.sentiment_label if f.analysis else "Unknown"
        })
    
    # 3. Gọi service hỏi Gemini
    answer = services.ask_gemini_about_data(payload.question, context_data)
    
    return {"answer": answer}

@router.get("/customers", response_model=schemas.PaginatedCustomerResponse)
def read_customers(page: int = 1, per_page: int = 10, db: Session = Depends(database.get_db)):
    skip = (page - 1) * per_page
    customers, total_count = crud.get_customer_profiles(db, skip=skip, limit=per_page)
    total_pages = (total_count + per_page - 1) // per_page  # Ceiling division

    return {
        "customers": customers,
        "total_count": total_count,
        "total_pages": total_pages,
        "current_page": page,
        "per_page": per_page
    }

@router.post("/customers/analyze-profile")
def analyze_customer(payload: CustomerAnalyzeRequest, db: Session = Depends(database.get_db)):
    # 1. Lấy lịch sử
    history = crud.get_customer_history(db, payload.name)
    
    # 2. Gọi AI phân tích
    insight = services.analyze_customer_persona(payload.name, history)
    
    return {
        "customer": payload.name,
        "history_count": len(history),
        "insight": insight
    }

@router.post("/feedbacks/batch-import")
def batch_import_feedbacks(
    payload: schemas.ScrapeBatchRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    print(f"📡 Nhận {len(payload.items)} comment từ Extension. URL: {payload.url}")
    
    def process_batch_items(items, source_platform):
        count = 0
        src_id = 3
        if source_platform == 'FACEBOOK': src_id = 1
        elif source_platform == 'SHOPEE': src_id = 2
            
        for item in items:
            try:
                # 1. XỬ LÝ THỜI GIAN (Ưu tiên original_timestamp nếu có)
                final_time = None
                
                # Logic parse thời gian an toàn
                time_str_to_parse = item.original_timestamp or item.created_at
                if time_str_to_parse:
                    try:
                        final_time = parser.parse(time_str_to_parse)
                    except:
                        final_time = datetime.now() # Fallback nếu lỗi format

                # 2. GỌI CRUD
                # Lưu ý: Pass final_time vào để DB lưu đúng ngày khách comment
                db_feedback = crud.create_feedback_with_analysis(
                    db, 
                    item.content, 
                    source_id=src_id, 
                    custom_time=final_time 
                )
                
                # 3. CHUẨN BỊ JSON CUSTOMER INFO
                info_data = {
                    "name": item.author_name,
                    "likes": str(item.likes),
                    "imported_from": "chrome_extension",
                    "original_url": payload.url,
                    "original_timestamp": item.original_timestamp 
                }

                # 4. GÁN VÀO DB VÀO ÉP KIỂU DICT
                # SQLAlchemy cần gán đè lại để nhận biết thay đổi với JSON
                db_feedback.customer_info = info_data
                
                db.add(db_feedback) 
                db.commit()
                count += 1
            except Exception as e:
                print(f"❌ Lỗi dòng: {e}")
                db.rollback()
                continue
        print(f"✅ Đã import thành công {count} dòng.")

    background_tasks.add_task(process_batch_items, payload.items, payload.items[0].source_platform if payload.items else "OTHER")
    return {"message": "Đang xử lý...", "count": len(payload.items)}

@router.get("/dashboard/trend")
def get_trend(days: int = 1, db: Session = Depends(database.get_db)):
    return crud.get_sentiment_trend(db, days)

@router.post("/monitor", response_model=schemas.MonitorTaskResponse)
def add_monitor_task(payload: schemas.MonitorTaskCreate, db: Session = Depends(database.get_db)):
    # Kiểm tra trùng lặp
    exists = db.query(models.MonitorTask).filter(models.MonitorTask.url == payload.url).first()
    if exists:
        # Nếu đã có thì kích hoạt lại
        exists.is_active = True
        db.commit()
        db.refresh(exists)
        return exists

    new_task = models.MonitorTask(
        url=payload.url,
        memo=payload.memo,
        platform=payload.platform,
        is_active=True
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/monitor", response_model=List[schemas.MonitorTaskResponse])
def get_monitor_tasks(db: Session = Depends(database.get_db)):
    # Chỉ lấy các task đang kích hoạt để Extension chạy
    return db.query(models.MonitorTask).filter(models.MonitorTask.is_active == True).all()

@router.delete("/monitor/{task_id}")
def delete_monitor_task(task_id: int, db: Session = Depends(database.get_db)):
    task = db.query(models.MonitorTask).filter(models.MonitorTask.id == task_id).first()
    if task:
        # Xóa mềm (chỉ tắt active) hoặc xóa cứng tùy bạn. Ở đây ta xóa cứng cho gọn.
        db.delete(task)
        db.commit()
    return {"message": "Đã xóa task"}