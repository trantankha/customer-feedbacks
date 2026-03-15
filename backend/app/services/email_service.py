"""
Email service using Resend SDK.
"""
import resend
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Configure Resend
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Sends an email using Resend.
    Returns True if successful, False otherwise.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("Resend skipped: API Key not configured.")
        return False

    try:
        params = {
            "from": settings.FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Email sent successfully to {to_email}. ID: {response.get('id')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via Resend: {e}")
        return False

def format_negative_alert_html(platform: str, content: str, score: float, author: str = "Khách hàng ẩn danh") -> str:
    """
    Formats a professional HTML email for negative feedback alerts.
    """
    severity_color = "#e74c3c" # Red
    
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: {severity_color}; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">🚨 CẢNH BÁO TIÊU CỰC MỚI</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Xin chào Admin,</p>
                    <p>Hệ thống vừa phát hiện một phản hồi tiêu cực từ khách hàng cần được xử lý ngay:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Nguồn:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">{platform.capitalize()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Người gửi:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">{author}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Độ nghiêm trọng:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; color: {severity_color}; font-weight: bold;">{score}</td>
                        </tr>
                    </table>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid {severity_color}; font-style: italic; margin-bottom: 20px;">
                        "{content}"
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:3000/dashboard" 
                           style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Truy cập Dashboard CRM
                        </a>
                    </div>
                </div>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #777;">
                    Đây là email tự động từ hệ thống Feedback System Pro.
                </div>
            </div>
        </body>
    </html>
    """
    return html

def format_import_summary_html(platform: str, processed: int, total: int, negative_count: int) -> str:
    """
    Formats a summary email after a batch import.
    """
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #2ecc71; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">✅ HOÀT TẤT IMPORT DỮ LIỆU</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Xin chào Admin,</p>
                    <p>Quá trình import dữ liệu khách hàng từ <b>{platform}</b> đã hoàn tất:</p>
                    
                    <div style="display: flex; justify-content: space-around; margin: 25px 0; text-align: center;">
                        <div style="padding: 10px;">
                            <div style="font-size: 24px; font-weight: bold; color: #3498db;">{total}</div>
                            <div style="font-size: 12px; color: #777;">Tổng bản ghi</div>
                        </div>
                        <div style="padding: 10px;">
                            <div style="font-size: 24px; font-weight: bold; color: #2ecc71;">{processed}</div>
                            <div style="font-size: 12px; color: #777;">Thành công</div>
                        </div>
                        <div style="padding: 10px;">
                            <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">{negative_count}</div>
                            <div style="font-size: 12px; color: #777;">Tiêu cực mới</div>
                        </div>
                    </div>
                    
                    <p>Hệ thống đã phân tích tất cả các bình luận bằng AI và cập nhật vào Dashboard.</p>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="http://localhost:3000/dashboard" 
                           style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Xem kết quả chi tiết
                        </a>
                    </div>
                </div>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #777;">
                    Feedback System Pro Insight Service.
                </div>
            </div>
        </body>
    </html>
    """
    return html
