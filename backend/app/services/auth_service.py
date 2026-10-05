from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.conf.settings import settings
from app.database.crud import user as user_crud
from app.database.models import User
from app.schemas.auth import Token, UserCreate


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(subject: str) -> Token:
    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    payload = {"sub": subject, "exp": datetime.now(timezone.utc) + timedelta(seconds=expires_in)}
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return Token(access_token=token, expires_in=expires_in)


def decode_access_token(token: str) -> str | None:
    """Return the username in the token, or None if it is invalid or expired."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    return payload.get("sub")


async def authenticate(db: AsyncSession, username: str, password: str) -> Token:
    user = await user_crud.get_by_username(db, username)
    if not user or not user.is_active or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return create_access_token(user.username)


async def user_from_token(db: AsyncSession, token: str) -> User:
    username = decode_access_token(token)
    user = await user_crud.get_by_username(db, username) if username else None
    if not user or not user.is_active:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def register(db: AsyncSession, data: UserCreate) -> Token:
    if await user_crud.get_by_username(db, data.username):
        raise HTTPException(status.HTTP_409_CONFLICT, "That username is already taken")
    user = await user_crud.create(db, data.username, hash_password(data.password), data.full_name or None)
    return create_access_token(user.username)
