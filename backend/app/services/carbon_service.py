from sqlalchemy.ext.asyncio import AsyncSession

from app.database.crud import carbon as crud
from app.schemas.carbon import CarbonSummary, EmissionFactorRead, SectorTotal


async def summary(db: AsyncSession) -> CarbonSummary:
    villages_total, population_total = await crud.village_totals(db)
    assessed, emission, seq, net_before, net_after, reduction, seq_increase = await crud.budget_totals(db)
    return CarbonSummary(
        villages_total=villages_total,
        population_total=population_total,
        villages_assessed=assessed,
        total_emission_kg=emission,
        total_sequestration_kg=seq,
        net_emission_before_kg=net_before,
        net_emission_after_kg=net_after,
        emission_reduction_kg=reduction,
        sequestration_increase_kg=seq_increase,
        reduction_pct=round((net_before - net_after) / net_before * 100, 2) if net_before else None,
        by_sector=[SectorTotal(sector=s, emission_kg=v) for s, v in await crud.emissions_by_sector(db)],
    )


async def emission_factors(db: AsyncSession) -> list[EmissionFactorRead]:
    return [EmissionFactorRead.model_validate(f) for f in await crud.emission_factors(db)]
