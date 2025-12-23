# backend/app/core.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Feedback System Pro"
    DATABASE_URL: str
    GEMINI_API_KEY: str
    SECRET_KEY: str
    
    # Class Config này giúp Pydantic tự tìm file .env
    class Config:
        env_file = ".env"

settings = Settings()