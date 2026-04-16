"""
Celery configuration and app initialization.
"""
import os
import logging
from celery import Celery
from celery.schedules import crontab

# Suppress noisy Celery Redis backend logs (e.g., "AFC is enabled...")
logging.getLogger("celery.backends.redis").setLevel(logging.WARNING)

# Get DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/customer_feedbacks")

# Get Redis URL from environment (default to localhost:6379)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "customer_feedbacks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "app.services.tasks",
    ],
)

# Celery configuration
celery_app.conf.update(
    # Task serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,

    # Task execution settings
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    task_soft_time_limit=240,  # 4 minutes soft limit

    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,  # Suppress deprecation warning

    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,  # Store additional task info

    # Rate limiting
    worker_max_tasks_per_child=1000,

    # Monitoring
    task_send_sent_event=True,
    worker_send_task_events=True,

    # Disable worker inspect methods to suppress "Inspect method failed" warnings
    worker_disable_rate_limits=True,
)

# Optional: Define periodic tasks
celery_app.conf.beat_schedule = {
    # Môi trường Dev/Local: Chạy mỗi 5 phút một lần để dễ dàng test tính năng dọn dẹp bộ nhớ
    # (Khi lên Production có thể đổi lại thành crontab(hour=2, minute=0) để chạy lúc 2h sáng)
    "archive-old-feedbacks": {
        "task": "app.services.tasks.archive_old_feedbacks_task",
        "schedule": crontab(minute='*/5'),
    },
}
