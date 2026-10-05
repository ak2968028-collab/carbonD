from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import User


async def get_by_username(db: AsyncSession, username: str) -> User | None:
    return await db.scalar(select(User).where(User.username == username))


async def create(db: AsyncSession, username: str, hashed_password: str, full_name: str | None) -> User:
    user = User(username=username, hashed_password=hashed_password, full_name=full_name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
