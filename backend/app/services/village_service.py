from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.crud import village as crud
from app.schemas.village import VillageBoundary, VillageDetail, VillagePage, VillageSummary
from app.services import geoserver_service

MAX_COMPARE = 4


def _summary(village, has_carbon: bool) -> VillageSummary:
    return VillageSummary.model_validate(village).model_copy(update={"has_carbon_data": has_carbon})


def _detail(village) -> VillageDetail:
    detail = VillageDetail.model_validate(village)
    detail.has_carbon_data = village.budget is not None
    detail.emissions.sort(key=lambda e: e.emission_kg, reverse=True)
    detail.interventions.sort(key=lambda i: i.reduction_kg, reverse=True)
    detail.sequestration.sort(key=lambda s: (s.phase != "before", -s.co2_kg))
    detail.scenarios.sort(key=lambda s: (s.scenario, s.year))
    return detail


async def list_villages(db: AsyncSession, search: str | None, has_carbon: bool | None, skip: int, limit: int) -> VillagePage:
    total, rows = await crud.search(db, search, has_carbon, skip, limit)
    return VillagePage(total=total, items=[_summary(v, h) for v, h in rows])


async def get_village(db: AsyncSession, vlcode: str) -> VillageDetail:
    village = await crud.get_detail(db, vlcode)
    if village is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Village {vlcode} not found")
    return _detail(village)


async def compare_villages(db: AsyncSession, vlcodes: list[str]) -> list[VillageDetail]:
    vlcodes = list(dict.fromkeys(c.strip() for c in vlcodes if c.strip()))
    if not 2 <= len(vlcodes) <= MAX_COMPARE:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Compare between 2 and {MAX_COMPARE} villages")
    found = {v.vlcode: v for v in await crud.get_details(db, vlcodes)}
    missing = [c for c in vlcodes if c not in found]
    if missing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Villages not found: {', '.join(missing)}")
    return [_detail(found[c]) for c in vlcodes]  # keep the requested order


async def get_boundary(vlcode: str) -> VillageBoundary:
    feature = await geoserver_service.village_boundary(vlcode)
    if feature is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No boundary for village {vlcode} in GeoServer")
    return VillageBoundary(**feature)


async def village_at(db: AsyncSession, lon: float, lat: float) -> VillageSummary:
    vlcode = await geoserver_service.vlcode_at(lon, lat)
    row = await crud.get_summary(db, vlcode) if vlcode else None
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No village at this location")
    return _summary(*row)
