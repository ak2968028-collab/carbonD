from pydantic import BaseModel, ConfigDict


class SectorTotal(BaseModel):
    sector: str
    emission_kg: float


class CarbonSummary(BaseModel):
    villages_total: int
    population_total: int
    villages_assessed: int
    total_emission_kg: float
    total_sequestration_kg: float
    net_emission_before_kg: float
    net_emission_after_kg: float
    emission_reduction_kg: float
    sequestration_increase_kg: float
    reduction_pct: float | None
    by_sector: list[SectorTotal]


class EmissionFactorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category: str
    emission_factor: str
    source: str | None
