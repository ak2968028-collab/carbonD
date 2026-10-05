from typing import Any

from pydantic import BaseModel, ConfigDict


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class VillageSummary(ORM):
    vlcode: str
    name: str
    subdistrict_code: str | None
    population_2011: int | None
    has_carbon_data: bool = False


class VillagePage(BaseModel):
    total: int
    items: list[VillageSummary]


class CarbonBudgetRead(ORM):
    total_emission_before: float | None
    total_sequestration_before: float | None
    net_emission_before: float | None
    monthly_net_emission_before: float | None
    per_capita_emission_before: float | None
    previous_net_emission: float | None
    net_emission_after: float | None
    emission_reduction: float | None
    sequestration_increase: float | None
    total_impact: float | None
    reduction_pct: float | None


class EmissionSourceRead(ORM):
    sector: str
    source: str
    emission_kg: float


class InterventionRead(ORM):
    sector: str
    name: str
    reduction_kg: float


class SequestrationRead(ORM):
    phase: str
    measure: str
    area_ha: float | None
    co2_kg: float


class ScenarioPointRead(ORM):
    scenario: str
    year: int
    emission_kg: float


class ActivityRead(ORM):
    activity: str
    unit: str
    value: float | None


class VillageDetail(VillageSummary):
    budget: CarbonBudgetRead | None
    emissions: list[EmissionSourceRead]
    interventions: list[InterventionRead]
    sequestration: list[SequestrationRead]
    scenarios: list[ScenarioPointRead]
    activities: list[ActivityRead]


class VillageBoundary(BaseModel):
    """GeoJSON Feature (EPSG:4326) from the GeoServer village layer, with census attributes."""

    type: str = "Feature"
    id: str | None = None
    geometry: dict[str, Any]
    properties: dict[str, Any]
