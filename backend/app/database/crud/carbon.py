from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import CarbonBudget, EmissionFactor, EmissionSource, Village


async def village_totals(db: AsyncSession) -> tuple[int, int]:
    row = (await db.execute(select(func.count(), func.coalesce(func.sum(Village.population_2011), 0)))).one()
    return row[0], row[1]


async def budget_totals(db: AsyncSession):
    c = CarbonBudget
    return (await db.execute(select(
        func.count(),
        func.coalesce(func.sum(c.total_emission_before), 0),
        func.coalesce(func.sum(c.total_sequestration_before), 0),
        func.coalesce(func.sum(c.net_emission_before), 0),
        func.coalesce(func.sum(c.net_emission_after), 0),
        func.coalesce(func.sum(c.emission_reduction), 0),
        func.coalesce(func.sum(c.sequestration_increase), 0),
    ))).one()


async def emissions_by_sector(db: AsyncSession):
    total = func.sum(EmissionSource.emission_kg)
    stmt = select(EmissionSource.sector, total).group_by(EmissionSource.sector).order_by(total.desc())
    return (await db.execute(stmt)).all()


async def emission_factors(db: AsyncSession) -> list[EmissionFactor]:
    return list(await db.scalars(select(EmissionFactor).order_by(EmissionFactor.category)))
