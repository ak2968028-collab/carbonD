from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.schemas.village import VillageBoundary, VillageDetail, VillagePage, VillageSummary
from app.services import village_service

router = APIRouter(prefix="/villages", tags=["villages"])


@router.get("", response_model=VillagePage)
async def list_villages(
    search: str | None = Query(None, description="Village name (partial) or vlcode prefix"),
    has_carbon: bool | None = Query(None, description="Only villages with (true) / without (false) carbon data"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    return await village_service.list_villages(db, search, has_carbon, skip, limit)


@router.get("/compare", response_model=list[VillageDetail])
async def compare_villages(
    vlcodes: str = Query(..., description="2-4 comma-separated vlcodes, e.g. 209115,209291"),
    db: AsyncSession = Depends(get_db),
):
    return await village_service.compare_villages(db, vlcodes.split(","))


@router.get("/at", response_model=VillageSummary)
async def village_at(
    lon: float = Query(..., ge=-180, le=180),
    lat: float = Query(..., ge=-90, le=90),
    db: AsyncSession = Depends(get_db),
):
    """Village whose boundary contains the point (used for map clicks)."""
    return await village_service.village_at(db, lon, lat)


@router.get("/{vlcode}", response_model=VillageDetail)
async def get_village(vlcode: str, db: AsyncSession = Depends(get_db)):
    return await village_service.get_village(db, vlcode)


@router.get("/{vlcode}/boundary", response_model=VillageBoundary)
async def get_boundary(vlcode: str):
    return await village_service.get_boundary(vlcode)
