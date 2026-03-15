# Feedback System Pro 🚀

**Feedback System Pro** là một nền tảng quản lý và phân tích phản hồi khách hàng toàn diện, tích hợp trí tuệ nhân tạo (AI) để giúp doanh nghiệp thấu hiểu khách hàng một cách tự động và chuyên nghiệp.

Hệ thống được thiết kế để xử lý dữ liệu lớn thông qua cơ chế hàng đợi (Queue), cung cấp các cảnh báo tức thì qua Telegram/Email và trình diễn dữ liệu trực quan trên Dashboard hiện đại.

---

## 🌟 Tính năng chính

- **Phân tích AI thông minh**: Sử dụng Google Gemini AI để tự động phân tích cảm xúc (Sentiment) và trích xuất nguyên nhân gốc rễ (Root Cause) từ bình luận của khách hàng.
- **Xử lý tác vụ nền (Background Tasks)**: Tích hợp Celery & Redis để xử lý các tệp CSV hàng nghìn dòng mà không gây treo hệ thống.
- **Hệ thống cảnh báo đa kênh**:
    - **Telegram**: Gửi thông báo tức thì khi phát hiện phản hồi tiêu cực.
    - **Email (Resend)**: Gửi báo cáo tổng kết và cảnh báo chi tiết với giao diện HTML chuyên nghiệp.
- **Chrome Extension Scraper**: Cho phép thu thập dữ liệu trực tiếp từ các nền tảng mạng xã hội (TikTok, Facebook,...) và đẩy thẳng vào hệ thống.
- **Dashboard trực quan**: Theo dõi chỉ số cảm xúc, xu hướng phản hồi và các vấn đề nổi cộm theo thời gian thực.
- **Giám sát hệ thống**: Tích hợp Flower để quản lý trạng thái các tác vụ chạy ngầm.

---

## 🛠 Công nghệ sử dụng

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL với SQLAlchemy ORM
- **Task Queue**: Celery & Redis
- **AI**: Google Generative AI (Gemini Flash 2.0)
- **Migrations**: Alembic

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Modern UI/UX

### Infrastructure
- **Containerization**: Docker & Docker Compose (duy nhất cho Database và Redis)
- **Monitoring**: Flower (Celery Monitoring)
- **Email Service**: Resend SDK

---

## 🚀 Hướng dẫn cài đặt

### 1. Chuẩn bị Cơ sở hạ tầng (Docker)
Đảm bảo bạn đã cài đặt Docker, sau đó chạy lệnh để bật Postgres và Redis:
```bash
docker-compose up -d
```

### 2. Cấu hình môi trường (.env)
Tạo file `.env` trong thư mục `backend/` dựa trên mẫu và cập nhật các API Key:
- `GEMINI_API_KEY`: Lấy từ Google AI Studio.
- `TELEGRAM_BOT_TOKEN`: Lấy từ BotFather.
- `RESEND_API_KEY`: Lấy từ Resend.com.

### 3. Cài đặt và Chạy Backend
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head  # Khởi tạo database
python run_all.py     # Chạy Backend + Worker + Flower
```

### 4. Cài đặt và Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔍 Giám sát và Kiểm thử

- **Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Monitor Tasks (Flower)**: [http://localhost:5555](http://localhost:5555)
- **Test Email**: Chạy `python scripts/test_resend.py` trong thư mục backend.

---

## 📁 Cấu trúc thư mục

```text
├── backend/            # FastAPI Source Code, Models, Tasks
├── frontend/           # Next.js Application, Components, Hooks
├── extension-scraper/  # Chrome Extension source code
├── docker-compose.yml  # Infrastructure configuration (DB, Redis)
└── README.md           # Project documentation
```

---

## 🛡 Bảo mật
Hệ thống không lưu trữ API Key trực tiếp trong mã nguồn. Tất cả thông tin nhạy cảm được quản lý thông qua biến môi trường (.env) và tệp này được liệt kê trong `.gitignore` để đảm bảo an toàn.

---
*Phát triển với ❤️ bởi **FeedBack System Pro Team***.