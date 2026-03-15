"""
Feedback System Pro — Application entry point.
"""
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.exceptions import register_exception_handlers
from app.db.init_db import init_source_data
from app.api.v1 import router as api_v1_router

# Initialize logging
setup_logging(level=settings.LOG_LEVEL)
logger = get_logger(__name__)


def check_and_create_database():
    """Check if the target database exists, create it if not."""
    try:
        url_obj = make_url(settings.DATABASE_URL)
        target_db_name = url_obj.database

        if not target_db_name:
            logger.warning("DATABASE_URL has no database name. Skipping check.")
            return

        system_url = url_obj.set(database="postgres")
        logger.info(f"Checking database '{target_db_name}'...")

        temp_engine = create_engine(system_url, isolation_level="AUTOCOMMIT")

        with temp_engine.connect() as conn:
            query = text("SELECT 1 FROM pg_database WHERE datname = :name")
            exists = conn.execute(query, {"name": target_db_name}).scalar()

            if not exists:
                logger.warning(f"Database '{target_db_name}' does not exist")
                logger.info(f"Creating database '{target_db_name}'...")
                conn.execute(text(f'CREATE DATABASE "{target_db_name}"'))
                logger.info(f"Database '{target_db_name}' created successfully")
            else:
                logger.info(f"Database '{target_db_name}' exists")

    except Exception as e:
        logger.error(f"Database check/create error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SERVER STARTING")

    # 1. Check & create database (if not exists)
    check_and_create_database()

    # 2. Tables are managed by Alembic migrations
    # Run: alembic upgrade head
    # Note: Base.metadata.create_all() is NOT used with Alembic

    # 3. Seed data
    init_source_data()

    # 4. Create tmp directory
    if not os.path.exists("tmp"):
        os.makedirs("tmp")
        logger.info("Created tmp directory")

    yield

    logger.info("SERVER SHUTDOWN")


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
)

# Register exception handlers
register_exception_handlers(app)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)