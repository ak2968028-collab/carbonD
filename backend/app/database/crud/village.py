from sqlalchemy import exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import CarbonBudget, Village

HAS_CARBON = exists().where(CarbonBudget.vlcode == Village.vlcode).label("has_carbon_data")

DETAIL_OPTIONS = [
    selectinload(Village.budget),
    selectinload(Village.emissions),
    selectinload(Village.interventions),
    selectinload(Village.sequestration),
    selectinload(Village.scenarios),
    selectinload(Village.activities),
]


def _filtered(search: str | None, has_carbon: bool | None):
    stmt = select(Village, HAS_CARBON)
    if search:
        stmt = stmt.where(or_(Village.name.ilike(f"%{search}%"), Village.vlcode.startswith(search)))
    if has_carbon is not None:
        stmt = stmt.where(HAS_CARBON if has_carbon else ~HAS_CARBON)
    return stmt


async def search(db: AsyncSession, search: str | None, has_carbon: bool | None, skip: int, limit: int):
    stmt = _filtered(search, has_carbon)
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    # Assessed villages first, then alphabetical
    rows = await db.execute(stmt.order_by(HAS_CARBON.desc(), Village.name).offset(skip).limit(limit))
    return total, rows.all()


async def get_summary(db: AsyncSession, vlcode: str):
    return (await db.execute(select(Village, HAS_CARBON).where(Village.vlcode == vlcode))).first()


async def get_detail(db: AsyncSession, vlcode: str) -> Village | None:
    return await db.scalar(select(Village).options(*DETAIL_OPTIONS).where(Village.vlcode == vlcode))


async def get_details(db: AsyncSession, vlcodes: list[str]) -> list[Village]:
    result = await db.scalars(select(Village).options(*DETAIL_OPTIONS).where(Village.vlcode.in_(vlcodes)))
    return list(result)
