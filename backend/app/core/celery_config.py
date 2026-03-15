"""
Celery configuration and app initialization.
"""
import os
from celery import Celery
from celery.schedules import crontab

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
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,  # Store additional task info
    
    # Rate limiting
    worker_max_tasks_per_child=1000,
    
    # Monitoring
    task_send_sent_event=True,
    worker_send_task_events=True,
)

# Optional: Define periodic tasks (for future use)
celery_app.conf.beat_schedule = {
    # Example: Run monitoring check every hour
    # "check-monitor-tasks": {
    #     "task": "app.services.tasks.run_monitor_checks",
    #     "schedule": crontab(minute=0),  # Every hour
    # },
    # Example: Send daily summary at 8 AM
    # "send-daily-summary": {
    #     "task": "app.services.tasks.send_daily_summary",
    #     "schedule": crontab(hour=8, minute=0),
    # },
}
