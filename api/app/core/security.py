from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError, InvalidHashError
from jose import JWTError, jwt, ExpiredSignatureError

from app.core.config import settings

# Initialize Argon2id password hasher
ph = PasswordHasher()


import asyncio


def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    return ph.hash(password)


get_password_hash = hash_password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerificationError, VerifyMismatchError, InvalidHashError, Exception):
        return False


async def verify_password_async(plain_password: str, hashed_password: str) -> bool:
    """Verify password in thread pool to prevent blocking async event loop."""
    return await asyncio.to_thread(verify_password, plain_password, hashed_password)


async def hash_password_async(password: str) -> str:
    """Hash password in thread pool to prevent blocking async event loop."""
    return await asyncio.to_thread(hash_password, password)


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Generate JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": now, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and return JWT payload without error handling."""
    return jwt.decode(
        token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )


def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token and return payload if valid."""
    try:
        payload = decode_access_token(token)
        if payload.get("type") != "access":
            raise JWTError("Invalid token type")
        return payload
    except ExpiredSignatureError:
        raise JWTError("Token has expired")
    except JWTError as e:
        raise JWTError(f"Invalid token: {str(e)}")


def create_reset_token(email: str) -> str:
    """Generate short-lived password reset token."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": email, "exp": expire, "iat": now, "type": "reset"}
    return jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def verify_reset_token(token: str) -> Optional[str]:
    """Verify reset token and return email if valid."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "reset":
            return None
        return payload.get("sub")
    except (JWTError, Exception):
        return None
