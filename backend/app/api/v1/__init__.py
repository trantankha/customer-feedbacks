"""
API v1 router aggregation.
Combines all endpoint routers into a single v1 router.
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.feedbacks import router as feedbacks_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.customers import router as customers_router
from app.api.v1.chat import router as chat_router
from app.api.v1.monitor import router as monitor_router
from app.api.v1.sources import router as sources_router
from app.api.v1.health import router as health_router
from app.api.v1.tasks import router as tasks_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(feedbacks_router)
router.include_router(dashboard_router)
router.include_router(customers_router)
router.include_router(chat_router)
router.include_router(monitor_router)
router.include_router(sources_router)
router.include_router(health_router)
router.include_router(tasks_router)
