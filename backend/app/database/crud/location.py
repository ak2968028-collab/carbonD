from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Location
from app.utils.geo import point_wkt


def _with_coords():
    return select(Location, func.ST_X(Location.geom), func.ST_Y(Location.geom))


async def get(db: AsyncSession, location_id: int):
    result = await db.execute(_with_coords().where(Location.id == location_id))
    return result.first()


async def get_multi(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(_with_coords().order_by(Location.id).offset(skip).limit(limit))
    return result.all()


async def create(db: AsyncSession, name: str, description: str | None, lon: float, lat: float) -> Location:
    obj = Location(name=name, description=description, geom=point_wkt(lon, lat))
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update(db: AsyncSession, obj: Location, data: dict) -> Location:
    lon, lat = data.pop("longitude", None), data.pop("latitude", None)
    for field, value in data.items():
        setattr(obj, field, value)
    if lon is not None and lat is not None:
        obj.geom = point_wkt(lon, lat)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete(db: AsyncSession, obj: Location) -> None:
    await db.delete(obj)
    await db.commit()
