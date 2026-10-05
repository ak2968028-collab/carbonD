from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import User
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.schemas.auth import Token, UserCreate, UserRead
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    return await auth_service.authenticate(db, form.username, form.password)


@router.post("/register", response_model=Token, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create an account and sign it in."""
    return await auth_service.register(db, data)


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)):
    return user
