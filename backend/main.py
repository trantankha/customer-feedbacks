import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url
from app.core import settings
from app.database import engine, Base
from app.api import router
from app.db.init_db import init_source_data

def check_and_create_database():
    """
    Kiểm tra xem database có tồn tại không, nếu chưa thì tạo mới.
    Sử dụng database mặc định 'postgres' để kết nối ban đầu.
    """
    try:
        url_obj = make_url(settings.DATABASE_URL)
        target_db_name = url_obj.database
        
        if not target_db_name:
            print("⚠️ [DB Check] DATABASE_URL không có tên database. Bỏ qua kiểm tra.")
            return

        # Kết nối tới DB hệ thống 'postgres' để kiểm tra
        system_url = url_obj.set(database='postgres')
        print(f"🔍 [DB Check] Đang kiểm tra database '{target_db_name}'...")
        
        # isolation_level="AUTOCOMMIT" cần thiết đê chạy CREATE DATABASE
        temp_engine = create_engine(system_url, isolation_level="AUTOCOMMIT")
        
        with temp_engine.connect() as conn:
            query = text(f"SELECT 1 FROM pg_database WHERE datname = :name")
            exists = conn.execute(query, {"name": target_db_name}).scalar()

            if not exists:
                print(f"⚠️ [DB Check] Database '{target_db_name}' chưa tồn tại.")
                print(f"✨ [DB Check] Đang tạo database '{target_db_name}'...")
                conn.execute(text(f'CREATE DATABASE "{target_db_name}"'))
                print(f"✅ [DB Check] Đã tạo database '{target_db_name}' thành công!")
            else:
                print(f"✅ [DB Check] Database '{target_db_name}' đã tồn tại.")
                
    except Exception as e:
        print(f"❌ [DB Check Error] Lỗi khi kiểm tra/tạo database: {e}")
        # Không raise lỗi để server vẫn thử chạy tiếp (có thể DB đã có nhưng lỗi quyền truy cập 'postgres')

# 👇 2. Định nghĩa sự kiện Vòng đời (Startup & Shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Code chạy khi Server KHỞI ĐỘNG ---
    print("--- 🚀 SERVER STARTING ---")
    
    # 1. Kiểm tra & Tạo Database trước khi tạo bảng
    check_and_create_database()
    
    # 2. Tạo bảng DB (nếu chưa có)
    Base.metadata.create_all(bind=engine)
    
    # 3. Gọi hàm gieo dữ liệu (Bạn có thể comment dòng này nếu không muốn chạy)
    init_source_data()

    # 4. Kiểm tra và tạo thư mục tmp nếu chưa có
    if not os.path.exists('tmp'):
        os.makedirs('tmp')
        print("--- 📁 Created tmp directory ---")

    yield # Server chạy tại đây
    
    # --- Code chạy khi Server TẮT (Cleanup) ---
    print("--- 🛑 SERVER SHUTDOWN ---")

# 👇 3. Gắn lifespan vào FastAPI App
app = FastAPI(
    title="Feedback System Pro",
    lifespan=lifespan # <--- Đăng ký tại đây
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)