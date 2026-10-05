from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.crud import location as crud
from app.schemas.location import LocationCreate, LocationRead, LocationUpdate


def _to_read(row) -> LocationRead:
    obj, lon, lat = row
    return LocationRead(
        id=obj.id, name=obj.name, description=obj.description,
        latitude=lat, longitude=lon, created_at=obj.created_at,
    )


async def _get_or_404(db: AsyncSession, location_id: int):
    row = await crud.get(db, location_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
    return row


async def list_locations(db: AsyncSession, skip: int, limit: int) -> list[LocationRead]:
    return [_to_read(r) for r in await crud.get_multi(db, skip, limit)]


async def get_location(db: AsyncSession, location_id: int) -> LocationRead:
    return _to_read(await _get_or_404(db, location_id))


async def create_location(db: AsyncSession, data: LocationCreate) -> LocationRead:
    obj = await crud.create(db, data.name, data.description, data.longitude, data.latitude)
    return await get_location(db, obj.id)


async def update_location(db: AsyncSession, location_id: int, data: LocationUpdate) -> LocationRead:
    obj, lon, lat = await _get_or_404(db, location_id)
    changes = data.model_dump(exclude_unset=True)
    # Moving the point needs both coordinates; fill in the missing one from the current value
    if "latitude" in changes or "longitude" in changes:
        changes.setdefault("latitude", lat)
        changes.setdefault("longitude", lon)
    await crud.update(db, obj, changes)
    return await get_location(db, location_id)


async def delete_location(db: AsyncSession, location_id: int) -> None:
    obj, _, _ = await _get_or_404(db, location_id)
    await crud.delete(db, obj)
