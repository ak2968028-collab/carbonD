from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.schemas.health import HealthRead
from app.services.geoserver_service import geoserver_status

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthRead)
async def health(db: AsyncSession = Depends(get_db)):
    postgis = (await db.execute(text("SELECT postgis_version()"))).scalar()
    return HealthRead(database="ok", postgis=postgis, geoserver=await geoserver_status())
