"""
Script to test Resend email delivery via Celery task.
Usage: python scripts/test_resend.py <recipient_email>
"""
import sys
import os

# Add parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.tasks import send_email_task

def test_email(recipient):
    print(f"🚀 Triggering test email (Resend) to: {recipient}...")
    
    subject = "🧪 Test Resend Integration"
    html_content = """
    <h1>Kết nối Resend thành công! 🚀</h1>
    <p>Đây là email thử nghiệm từ hệ thống <b>Feedback System Pro</b>.</p>
    <hr>
    <p>Nếu bạn thấy email này, có nghĩa là:</p>
    <ul>
        <li>Resend API Key đã hoạt động.</li>
        <li>Celery Worker đã nhận được task.</li>
        <li>Hệ thống queue đang hoạt động hoàn hảo.</li>
    </ul>
    """
    
    # Send via Celery (asynchronous)
    task = send_email_task.delay(recipient, subject, html_content)
    
    print(f"✅ Task triggered! Task ID: {task.id}")
    print("Check Flower (http://localhost:5555) or Worker logs to see progress.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Check if ADMIN_EMAIL is set
        from app.core.config import settings
        if settings.ADMIN_EMAIL:
            test_email(settings.ADMIN_EMAIL)
        else:
            print("Usage: python scripts/test_resend.py <recipient_email>")
    else:
        test_email(sys.argv[1])
