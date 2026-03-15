"""
Security utilities: password hashing and JWT token management.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from jose import JWTError, jwt
import bcrypt

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# ==============================================
# PASSWORD HASHING (using bcrypt directly)
# ==============================================


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = password.encode("utf-8")[:72]  # bcrypt max 72 bytes
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8"),
        )
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False


# ==============================================
# JWT TOKEN UTILITIES
# ==============================================
def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({
        "exp": expire,
        "type": "access",
        "iat": datetime.utcnow(),
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a JWT refresh token with longer expiry."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "iat": datetime.utcnow(),
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify a JWT token. Returns payload or None."""
    try:
        return jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify an access token is valid and of correct type."""
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    return payload


def verify_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a refresh token is valid and of correct type."""
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        return None
    return payload
