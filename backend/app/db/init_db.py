from app import models
from app.database import SessionLocal, engine

def init_source_data():
    """
    Hàm này kiểm tra và tạo dữ liệu mẫu cho bảng Source.
    Nó tự quản lý Session riêng để không ảnh hưởng đến main app.
    """
    db = SessionLocal()
    try:
        # Đảm bảo bảng đã được tạo
        models.Base.metadata.create_all(bind=engine)
        
        print("🌱 [Seeding] Đang kiểm tra dữ liệu nguồn...")
        
        # Danh sách nguồn chuẩn (Hard-code)
        sources_data = [
            {"id": 1, "name": "Facebook Comments", "platform": "FACEBOOK"},
            {"id": 2, "name": "Shopee Reviews", "platform": "SHOPEE"},
            {"id": 3, "name": "Other / Upload", "platform": "OTHER"},
        ]
        
        count_new = 0
        for data in sources_data:
            # Kiểm tra xem ID này đã có chưa
            source = db.query(models.Source).filter(models.Source.id == data["id"]).first()
            if not source:
                new_source = models.Source(**data) # Unpack dict thành object
                db.add(new_source)
                count_new += 1
        
        db.commit()
        if count_new > 0:
            print(f"✅ [Seeding] Đã khởi tạo thêm {count_new} nguồn dữ liệu.")
        else:
            print("👌 [Seeding] Dữ liệu nguồn đã đầy đủ.")
            
    except Exception as e:
        print(f"❌ [Seeding Error] Lỗi khởi tạo dữ liệu: {e}")
        db.rollback()
    finally:
        db.close()