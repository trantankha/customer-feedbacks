# Feedback System Pro

## Mô tả dự án

Feedback System Pro là một hệ thống quản lý và phân tích phản hồi khách hàng toàn diện. Dự án bao gồm ba thành phần chính:

- **Backend**: API server được xây dựng bằng FastAPI để xử lý dữ liệu phản hồi, phân tích và lưu trữ.
- **Frontend**: Giao diện người dùng được phát triển bằng Next.js để hiển thị dashboard, thống kê và quản lý phản hồi.
- **Extension-Scraper**: Phần mở rộng trình duyệt Chrome để thu thập phản hồi từ các nền tảng như Shopee và Facebook.

Mục tiêu của dự án là cung cấp một giải pháp toàn diện để thu thập, phân tích và trực quan hóa phản hồi khách hàng, giúp doanh nghiệp hiểu rõ hơn về ý kiến của khách hàng.

## Tính năng chính

- Thu thập phản hồi tự động từ Shopee và Facebook qua extension Chrome
- Phân tích phản hồi sử dụng AI (PhoBERT cho cảm xúc, Google Generative AI cho chat)
- Chatbot AI để hỏi đáp và phân tích sâu về dữ liệu phản hồi
- Phân tích chân dung khách hàng dựa trên lịch sử tương tác
- Trực quan hóa dữ liệu với biểu đồ từ vựng, biểu đồ phân tích và word cloud
- Dashboard quản lý phản hồi với giao diện thân thiện, hỗ trợ làm mới và xuất báo cáo
- Xuất báo cáo Excel với kết quả phân tích chi tiết
- Nhập hàng loạt phản hồi từ extension với xử lý nền
- Phân tích xu hướng cảm xúc theo thời gian
- Quản lý hồ sơ khách hàng với phân trang
- API RESTful cho tích hợp với các hệ thống khác
- Hỗ trợ tải lên file CSV/Excel để nhập dữ liệu phản hồi theo nền tảng

## Công nghệ sử dụng

### Backend
- **FastAPI**: Framework web nhanh cho Python
- **SQLAlchemy**: ORM cho cơ sở dữ liệu
- **PostgreSQL**: Cơ sở dữ liệu chính
- **Pandas**: Xử lý dữ liệu
- **Google Generative AI**: Chatbot AI và phân tích chân dung khách hàng
- **Transformers (PhoBERT)**: Phân tích cảm xúc tiếng Việt
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
Mở trình duyệt bật chế độ tối rồi truy cập url frontend để trải nghiệm giao diện nhé!

### 4. Extension

1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật "Developer mode"
3. Click "Load unpacked" và chọn thư mục `extension-scraper`
4. Extension sẽ xuất hiện trong thanh công cụ

## Cách sử dụng

1. **Cài đặt extension**: Cài đặt extension Chrome để thu thập phản hồi từ Shopee/Facebook
2. **Thu thập dữ liệu**: Sử dụng extension để scrape phản hồi và gửi về hệ thống tự động
3. **Xem dashboard**: Truy cập frontend để xem thống kê, biểu đồ phân tích và danh sách phản hồi
4. **Phân tích AI**: Sử dụng chatbot để hỏi đáp về dữ liệu, hoặc phân tích chân dung khách hàng
5. **Quản lý khách hàng**: Xem hồ sơ khách hàng và xu hướng tương tác
6. **Xuất báo cáo**: Tải xuống báo cáo Excel với kết quả phân tích chi tiết
7. **Tải lên dữ liệu**: Upload file CSV/Excel để nhập phản hồi theo nền tảng cụ thể

## API Documentation

API được cung cấp qua FastAPI với documentation tự động tại `/docs` khi server chạy.

Các endpoint chính:
- `GET /api/v1/feedbacks`: Lấy danh sách phản hồi
- `POST /api/v1/feedbacks/test-create`: Tạo phản hồi mới (test)
- `POST /api/v1/feedbacks/upload-csv`: Tải lên file CSV theo nền tảng
- `POST /api/v1/feedbacks/batch-import`: Nhập hàng loạt từ extension
- `PUT /api/v1/feedbacks/{id}/analysis`: Cập nhật kết quả phân tích
- `GET /api/v1/feedbacks/export`: Xuất báo cáo Excel
- `GET /api/v1/dashboard/stats`: Lấy thống kê dashboard
- `GET /api/v1/dashboard/keywords`: Lấy từ khóa nổi bật
- `GET /api/v1/dashboard/trend`: Lấy xu hướng cảm xúc
- `GET /api/v1/customers`: Lấy danh sách khách hàng (phân trang)
- `POST /api/v1/customers/analyze-profile`: Phân tích chân dung khách hàng
- `POST /api/v1/chat/ask`: Hỏi đáp với AI về dữ liệu phản hồi

## Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork dự án
2. Tạo branch cho tính năng mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## Giấy phép

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.