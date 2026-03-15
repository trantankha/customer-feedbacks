"""
Celery tasks for background processing.
"""
import pandas as pd
from io import BytesIO
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from dateutil import parser

from app.core.celery_config import celery_app
from app.db.session import SessionLocal
from app.core.config import settings
from app.services import feedback_service, source_service, email_service, tasks
from app.services.notification_service import (
    send_telegram_alert_async, 
    format_negative_feedback_message, 
    format_batch_negative_feedback_message
)
from app.core.logging import get_logger

logger = get_logger(__name__)

@celery_app.task(bind=True)
def process_csv_import_task(self, file_contents: bytes, platform: str, user_id: str):
    """
    Celery task to process CSV upload and import feedbacks.
    """
    db = SessionLocal()
    try:
        df = pd.read_csv(BytesIO(file_contents))
        config = feedback_service.PLATFORM_MAPPING.get(platform.upper(), feedback_service.PLATFORM_MAPPING["OTHER"])
        content_col = feedback_service._find_column(df.columns, config["content_cols"])

        if not content_col:
            logger.error(f"[{platform}] Content column not found.")
            return {"status": "error", "message": "Content column not found"}

        author_col = feedback_service._find_column(df.columns, config["author_cols"])
        time_col = feedback_service._find_column(df.columns, config["time_cols"])
        likes_col = feedback_service._find_column(df.columns, config["likes_cols"])

        source = source_service.get_source_by_platform(db, platform)
        source_id = source.id if source else None

        total_rows = len(df)
        processed_count = 0
        negative_alerts = []

        for i, row in df.iterrows():
            raw_text = row[content_col]
            if pd.isna(raw_text) or str(raw_text).strip() == "":
                continue

            text = str(raw_text)
            customer_meta = {"imported_from": platform}

            if author_col and pd.notna(row[author_col]):
                customer_meta["name"] = str(row[author_col])
            if time_col and pd.notna(row[time_col]):
                time_val = str(row[time_col])
                if platform == "SHOPEE" and "|" in time_val:
                    time_val = time_val.split("|")[0].strip()
                customer_meta["time_posted"] = time_val
            if likes_col and pd.notna(row[likes_col]):
                customer_meta["likes"] = str(row[likes_col])

            try:
                # Use the existing service logic for single item processing
                db_feedback, is_negative, alert_info = feedback_service.create_feedback_with_analysis(
                    db, 
                    text, 
                    source_id=source_id, 
                    author_name=customer_meta.get("name", "Khách hàng ẩn danh"),
                    created_by=UUID(user_id) if user_id else None
                )
                db_feedback.customer_info = customer_meta
                
                # Commit in batches of 20 to improve performance while maintaining progress
                processed_count += 1
                if processed_count % 20 == 0:
                    db.commit()
                    self.update_state(state='PROGRESS', meta={'current': processed_count, 'total': total_rows})
                
                if is_negative:
                    negative_alerts.append(alert_info)
                    
            except Exception as e:
                logger.warning(f"Row error: {e}")
                db.rollback()
                continue

        db.commit()
        logger.info(f"[{platform}] Processed {processed_count} rows successfully")
        
        # Dispatch batched alerts
        if negative_alerts:
            # 1. Telegram Alert
            if len(negative_alerts) == 1:
                a = negative_alerts[0]
                msg = format_negative_feedback_message(
                    platform=a["platform"], content=a["content"], score=a["score"], author=a["author"]
                )
                send_telegram_alert_async(msg)
                
                # 2. Email Alert (via Task)
                if settings.ADMIN_EMAIL:
                    html_msg = email_service.format_negative_alert_html(
                        platform=a["platform"], content=a["content"], score=a["score"], author=a["author"]
                    )
                    send_email_task.delay(
                        to_email=settings.ADMIN_EMAIL,
                        subject=f"🚨 CẢNH BÁO: Phản hồi tiêu cực từ {a['platform']}",
                        html_content=html_msg
                    )
            else:
                msg = format_batch_negative_feedback_message(negative_alerts)
                send_telegram_alert_async(msg)

        # 3. Import Summary Email
        if settings.ADMIN_EMAIL:
            summary_html = email_service.format_import_summary_html(
                platform=platform, 
                processed=processed_count, 
                total=total_rows, 
                negative_count=len(negative_alerts)
            )
            send_email_task.delay(
                to_email=settings.ADMIN_EMAIL,
                subject=f"✅ Hoàn tất Import dữ liệu: {platform}",
                html_content=summary_html
            )

        return {"status": "success", "processed": processed_count, "total": total_rows, "negatives": len(negative_alerts)}

    except Exception as e:
        logger.error(f"CSV task error: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@celery_app.task(bind=True)
def process_batch_import_task(self, items: List[dict], source_platform: str, user_id: str, original_url: str):
    """
    Celery task to process batch imports from Chrome Extension.
    """
    db = SessionLocal()
    try:
        count = 0
        negative_alerts = []
        source = source_service.get_source_by_platform(db, source_platform)
        source_id = source.id if source else None
        total_items = len(items)

        for i, item_dict in enumerate(items):
            try:
                content = item_dict.get("content")
                author_name = item_dict.get("author_name", "Khách hàng ẩn danh")
                created_at = item_dict.get("created_at")
                original_timestamp = item_dict.get("original_timestamp")
                likes = item_dict.get("likes", 0)

                final_time = None
                time_str_to_parse = original_timestamp or created_at
                if time_str_to_parse:
                    try:
                        final_time = parser.parse(time_str_to_parse)
                    except Exception:
                        final_time = datetime.now()

                db_feedback, is_negative, alert_info = feedback_service.create_feedback_with_analysis(
                    db,
                    content,
                    source_id=source_id,
                    custom_time=final_time,
                    created_by=UUID(user_id) if user_id else None,
                    author_name=author_name,
                )

                info_data = {
                    "name": author_name,
                    "likes": str(likes),
                    "imported_from": "chrome_extension",
                    "original_url": original_url,
                    "original_timestamp": original_timestamp,
                }

                db_feedback.customer_info = info_data
                count += 1
                
                if count % 20 == 0:
                    db.commit()
                    self.update_state(state='PROGRESS', meta={'current': count, 'total': total_items})
                
                if is_negative:
                    negative_alerts.append(alert_info)
                    
            except Exception as e:
                logger.error(f"Batch import task row error: {e}")
                db.rollback()
                continue

        db.commit()
        
        if negative_alerts:
            # 1. Telegram
            if len(negative_alerts) == 1:
                a = negative_alerts[0]
                msg = format_negative_feedback_message(
                    platform=a["platform"], content=a["content"], score=a["score"], author=a["author"]
                )
                send_telegram_alert_async(msg)
                
                # 2. Email Alert
                if settings.ADMIN_EMAIL:
                    html_msg = email_service.format_negative_alert_html(
                        platform=a["platform"], content=content, score=a["score"], author=a["author"]
                    )
                    send_email_task.delay(
                        to_email=settings.ADMIN_EMAIL,
                        subject=f"🚨 CẢNH BÁO: Chrome Extension - {a['platform']}",
                        html_content=html_msg
                    )
            else:
                msg = format_batch_negative_feedback_message(negative_alerts)
                send_telegram_alert_async(msg)

        # 3. Summary Email
        if settings.ADMIN_EMAIL:
            summary_html = email_service.format_import_summary_html(
                platform=source_platform, 
                processed=count, 
                total=total_items, 
                negative_count=len(negative_alerts)
            )
            send_email_task.delay(
                to_email=settings.ADMIN_EMAIL,
                subject=f"✅ Hoàn tất Batch Import: {source_platform}",
                html_content=summary_html
            )

        return {"status": "success", "processed": count, "total": total_items}

    except Exception as e:
        logger.error(f"Batch task error: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@celery_app.task(
    bind=True, 
    autoretry_for=(Exception,), 
    retry_kwargs={'max_retries': 3, 'countdown': 60}
)
def send_email_task(self, to_email: str, subject: str, html_content: str):
    """
    Background task to send email with auto-retry on failure.
    """
    logger.info(f"Sending email task to {to_email}: {subject}")
    success = email_service.send_email(to_email, subject, html_content)
    if not success:
        logger.error(f"Failed to send email to {to_email}. Retrying...")
        raise Exception("Resend delivery failed")
    return {"status": "success", "to": to_email}
