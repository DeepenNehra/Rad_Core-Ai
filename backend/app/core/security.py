"""
JWT Authentication & Password Hashing Utilities for MEDIVISTA AI.

Uses bcrypt for salted password hashing and HS256 JWT Bearer tokens
to protect clinical case history and study sign-off endpoints.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

try:
    import jwt  # PyJWT
    HAS_PYJWT = True
except ImportError:
    HAS_PYJWT = False

try:
    import bcrypt
    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False

try:
    from backend.app.core.config import settings
    from backend.app.database.session import get_db, get_user_by_username
    from backend.app.database.models import UserRecord
except ImportError:
    from app.core.config import settings
    from app.database.session import get_db, get_user_by_username
    from app.database.models import UserRecord

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt (with PBKDF2 fallback if unavailable)."""
    if HAS_BCRYPT:
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    # Standard-library fallback (still salted PBKDF2-SHA256)
    salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return f"pbkdf2_sha256${salt}${dk}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against stored hash."""
    if not hashed_password:
        return False

    if hashed_password.startswith("pbkdf2_sha256$"):
        try:
            _, salt, expected = hashed_password.split("$", 2)
            dk = hashlib.pbkdf2_hmac(
                "sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100_000
            ).hex()
            return hmac.compare_digest(dk, expected)
        except Exception:
            return False

    if HAS_BCRYPT:
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8"),
            )
        except Exception:
            return False

    return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed HS256 JWT access token."""
    if not HAS_PYJWT:
        raise RuntimeError("PyJWT is not installed. Please install PyJWT>=2.8.0.")

    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a signed JWT token."""
    if not HAS_PYJWT:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT authentication library missing on server.",
        )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> UserRecord:
    """Strict FastAPI dependency requiring a valid Bearer JWT token."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clinician authentication required to access protected case history.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_username(db, username)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clinician account not found or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[UserRecord]:
    """Optional auth dependency for endpoints that enrich audit fields when logged in."""
    if credentials is None or not credentials.credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        username = payload.get("sub")
        if not username:
            return None
        user = get_user_by_username(db, username)
        return user if (user and user.is_active) else None
    except HTTPException:
        return None
