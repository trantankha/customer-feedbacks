"""
Notification service: Sending real-time alerts to Telegram.
"""
import requests
import asyncio
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

def send_telegram_alert(message: str) -> bool:
    """
    Sends a message to the configured Telegram chat synchronously.
    Returns True if successful, False otherwise.
    """
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    if not token or not chat_id:
        logger.warning("Telegram notification skipped: Token or Chat ID not configured.")
        return False
        
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        logger.info(f"Telegram alert sent successfully to {chat_id}")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send Telegram alert: {e}")
        return False

def send_telegram_alert_async(message: str):
    """
    Fire-and-forget wrapper for sending telegram alerts without blocking the main thread.
    """
    try:
        loop = asyncio.get_running_loop()
        # Run the synchronous requests call in a thread pool
        loop.run_in_executor(None, send_telegram_alert, message)
    except RuntimeError:
        # If no event loop is running
        send_telegram_alert(message)

def format_negative_feedback_message(platform: str, content: str, score: float, author: str="") -> str:
    """
    Formats the alert message for a negative feedback.
    """
    emoji = "🔴"
    
    msg = f"<b>{emoji} CẢNH BÁO: TIÊU CỰC MỚI</b>\n\n"
    msg += f"<b>📌 Nguồn:</b> {platform.capitalize()}\n"
    if author:
        msg += f"<b>👤 Người gửi:</b> {author}\n"
    msg += f"<b>📉 Độ nghiêm trọng (Score AI):</b> {score}\n\n"
    msg += f"<b>📝 Nội dung:</b>\n<i>\"{content}\"</i>\n\n"
    msg += "👉 Vui lòng kiểm tra Dashboard CRM để phản hồi sớm nhất!"
    
    return msg

def format_batch_negative_feedback_message(alerts: list[dict]) -> str:
    """
    Formats a single alert message for multiple negative feedbacks.
    Expects a list of dicts: [{"platform", "content", "score", "author"}]
    """
    total = len(alerts)
    emoji = "⚠️"
    
    msg = f"<b>{emoji} BÁO CÁO NHANH: CÓ {total} BÌNH LUẬN TIÊU CỰC MỚI</b>\n\n"
    
    # Display up to 3 previews to avoid exceeding Telegram message size limits
    preview_limit = min(3, total)
    for i in range(preview_limit):
        a = alerts[i]
        platform = a.get("platform", "Unknown").capitalize()
        author = a.get("author", "Unknown")
        score = a.get("score", 0.0)
        # Truncate content if it's too long
        content = a.get("content", "")
        if len(content) > 100:
            content = content[:97] + "..."
            
        msg += f"🔴 <b>[{platform}] {author}</b> (Điểm: {score})\n"
        msg += f"<i>\"{content}\"</i>\n\n"
        
    if total > preview_limit:
        msg += f"<i>... và {total - preview_limit} bình luận khác.</i>\n\n"
        
    msg += "👉 Đăng nhập truy cập CRM ngay để xử lý khủng hoảng!"
    
    return msg
