from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.schemas.location import LocationCreate, LocationRead, LocationUpdate
from app.services import location_service

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationRead])
async def list_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    return await location_service.list_locations(db, skip, limit)


@router.get("/{location_id}", response_model=LocationRead)
async def get_location(location_id: int, db: AsyncSession = Depends(get_db)):
    return await location_service.get_location(db, location_id)


@router.post("", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
async def create_location(data: LocationCreate, db: AsyncSession = Depends(get_db)):
    return await location_service.create_location(db, data)


@router.patch("/{location_id}", response_model=LocationRead)
async def update_location(location_id: int, data: LocationUpdate, db: AsyncSession = Depends(get_db)):
    return await location_service.update_location(db, location_id, data)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: int, db: AsyncSession = Depends(get_db)):
    await location_service.delete_location(db, location_id)
