# Feedback System Pro

## Mô tả dự án

Feedback System Pro là một hệ thống quản lý và phân tích phản hồi khách hàng toàn diện. Dự án bao gồm ba thành phần chính:

- **Backend**: API server được xây dựng bằng FastAPI để xử lý dữ liệu phản hồi, phân tích và lưu trữ.
- **Frontend**: Giao diện người dùng được phát triển bằng Next.js để hiển thị dashboard, thống kê và quản lý phản hồi.
- **Extension-Scraper**: Phần mở rộng trình duyệt Chrome để thu thập phản hồi từ các nền tảng như Shopee và Facebook.

Mục tiêu của dự án là cung cấp một giải pháp toàn diện để thu thập, phân tích và trực quan hóa phản hồi khách hàng, giúp doanh nghiệp hiểu rõ hơn về ý kiến của khách hàng.

## Tính năng chính

- Thu thập phản hồi tự động từ Shopee và Facebook qua extension
- Phân tích phản hồi sử dụng AI (Google Generative AI)
- Trực quan hóa dữ liệu với biểu đồ từ vựng và thống kê
- Dashboard quản lý phản hồi với giao diện thân thiện
- API RESTful cho tích hợp với các hệ thống khác
- Hỗ trợ tải lên file Excel để nhập dữ liệu phản hồi

## Công nghệ sử dụng

### Backend
- **FastAPI**: Framework web nhanh cho Python
- **SQLAlchemy**: ORM cho cơ sở dữ liệu
- **PostgreSQL**: Cơ sở dữ liệu chính
- **Pandas**: Xử lý dữ liệu
- **Google Generative AI**: Phân tích phản hồi bằng AI
- **Uvicorn**: ASGI server

### Frontend
- **Next.js**: Framework React cho web
- **React**: Thư viện UI
- **TypeScript**: Kiểm tra kiểu dữ liệu
- **Tailwind CSS**: Framework CSS
- **Recharts**: Thư viện biểu đồ
- **Axios**: HTTP client

### Extension
- **Chrome Extension Manifest V3**: Phần mở rộng trình duyệt
- **JavaScript**: Ngôn ngữ lập trình chính

## Yêu cầu hệ thống

- Python 3.8+
- Node.js 16+
- PostgreSQL
- Google Chrome (cho extension)
- Tài khoản Google AI API (cho phân tích AI)

## Cài đặt và chạy

### 1. Chuẩn bị môi trường

- Cài đặt Python, Node.js và PostgreSQL
- Tạo database PostgreSQL cho dự án
- Lấy API key từ Google AI Studio

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
# Cấu hình biến môi trường cho database và Google AI API
uvicorn main:app --reload
```

Server sẽ chạy tại `http://127.0.0.1:8000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

### 4. Extension

1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật "Developer mode"
3. Click "Load unpacked" và chọn thư mục `extension-scraper`
4. Extension sẽ xuất hiện trong thanh công cụ

## Cách sử dụng

1. **Thu thập dữ liệu**: Sử dụng extension để scrape phản hồi từ Shopee/Facebook
2. **Xem dashboard**: Truy cập frontend để xem thống kê và danh sách phản hồi
3. **Phân tích**: Sử dụng tính năng AI để phân tích cảm xúc và chủ đề
4. **Xuất dữ liệu**: Tải xuống báo cáo dưới dạng Excel

## API Documentation

API được cung cấp qua FastAPI với documentation tự động tại `/docs` khi server chạy.

Các endpoint chính:
- `GET /api/v1/feedbacks`: Lấy danh sách phản hồi
- `POST /api/v1/feedbacks`: Tạo phản hồi mới
- `POST /api/v1/upload`: Tải lên file Excel
- `GET /api/v1/analytics`: Lấy dữ liệu phân tích

## Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork dự án
2. Tạo branch cho tính năng mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## Giấy phép

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.