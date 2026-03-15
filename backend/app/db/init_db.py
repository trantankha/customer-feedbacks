"""
Database initialization: seed sources and default admin user.
"""
from app.db.session import SessionLocal
from app.models import Source
from app.services import auth_service, source_service
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def init_source_data():
    """
    Check and create seed data for Source table and default admin user.
    
    Note: Tables should be created by Alembic migrations before calling this function.
    Run: alembic upgrade head
    """
    db = SessionLocal()
    try:
        # Note: Base.metadata.create_all() is NOT needed - tables are managed by Alembic
        # Just seed data into existing tables

        logger.info("[Seeding] Checking source data...")

        sources_data = [
            {"name": "Facebook Comments", "platform": "FACEBOOK"},
            {"name": "Shopee Reviews", "platform": "SHOPEE"},
            {"name": "Tiktok Comments", "platform": "TIKTOK"},
            {"name": "Other / Upload", "platform": "OTHER"},
        ]

        count_new = 0
        for data in sources_data:
            source = source_service.get_source_by_platform(db, data["platform"])
            if not source:
                source_service.create_source(db, name=data["name"], platform=data["platform"])
                count_new += 1

        if count_new > 0:
            logger.info(f"[Seeding] Initialized {count_new} new sources")
        else:
            logger.info("[Seeding] Source data already complete")

        # Create default admin user
        logger.info("[Seeding] Checking admin user...")
        admin = auth_service.get_user_by_username(db, "admin")

        if not admin:
            admin_password = settings.DEFAULT_ADMIN_PASSWORD
            admin_user = {
                "username": "admin",
                "email": "admin@example.com",
                "password": admin_password,
                "full_name": "Administrator",
            }
            auth_service.create_user(db, admin_user)

            admin = auth_service.get_user_by_username(db, "admin")
            if admin:
                admin.is_superuser = True
                db.commit()
                logger.info("[Seeding] Created default admin user (admin)")
                if settings.ENVIRONMENT == "development":
                    logger.warning(
                        f"[Seeding] Admin password: {admin_password} — CHANGE IN PRODUCTION!"
                    )
        else:
            logger.info("[Seeding] Admin user already exists")

    except Exception as e:
        logger.error(f"[Seeding Error] {e}")
        db.rollback()
    finally:
        db.close()