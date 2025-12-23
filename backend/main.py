import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import router
from app.db.init_db import init_source_data

# 👇 2. Định nghĩa sự kiện Vòng đời (Startup & Shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Code chạy khi Server KHỞI ĐỘNG ---
    print("--- 🚀 SERVER STARTING ---")
    
    # Tạo bảng DB (nếu chưa có)
    Base.metadata.create_all(bind=engine)
    
    # Gọi hàm gieo dữ liệu (Bạn có thể comment dòng này nếu không muốn chạy)
    init_source_data() 
    
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