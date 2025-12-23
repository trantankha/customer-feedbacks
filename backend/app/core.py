# Cấu hình hệ thống
class Settings:
    PROJECT_NAME: str = "Feedback System"
    # Thay password của bạn vào đây
    DATABASE_URL: str = "postgresql://postgres:070907@localhost/customer_feedback"

settings = Settings()