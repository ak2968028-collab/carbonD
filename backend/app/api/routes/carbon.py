from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.schemas.carbon import CarbonSummary, EmissionFactorRead
from app.services import carbon_service

router = APIRouter(prefix="/carbon", tags=["carbon"])


@router.get("/summary", response_model=CarbonSummary)
async def summary(db: AsyncSession = Depends(get_db)):
    return await carbon_service.summary(db)


@router.get("/emission-factors", response_model=list[EmissionFactorRead])
async def emission_factors(db: AsyncSession = Depends(get_db)):
    return await carbon_service.emission_factors(db)
