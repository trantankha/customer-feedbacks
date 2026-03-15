"""
Auth service: User CRUD + authentication logic.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import User
from app.core.security import hash_password, verify_password
from app.core.logging import get_logger

logger = get_logger(__name__)


def create_user(db: Session, user_data: Dict[str, Any]) -> User:
    """Create a new user with hashed password."""
    hashed_pw = hash_password(user_data["password"])
    db_user = User(
        username=user_data["username"],
        email=user_data["email"],
        hashed_password=hashed_pw,
        full_name=user_data.get("full_name"),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"Created user: {db_user.username}")
    return db_user


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user by username and password."""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def update_last_login(db: Session, user_id: UUID) -> None:
    """Update user's last login timestamp."""
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.last_login = datetime.utcnow()
        db.commit()
