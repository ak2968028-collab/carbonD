"""Village carbon accounting tables, loaded from media/Data/*.csv.

All emission / sequestration values are annual kg CO2e unless the column name says otherwise.
"""
from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

def village_fk() -> ForeignKey:
    return ForeignKey("villages.vlcode", ondelete="CASCADE")


class CarbonBudget(Base):
    """budget.csv: before/after summary of a village's carbon balance."""

    __tablename__ = "carbon_budgets"

    vlcode: Mapped[str] = mapped_column(village_fk(), primary_key=True)
    total_emission_before: Mapped[float | None] = mapped_column(Float)
    total_sequestration_before: Mapped[float | None] = mapped_column(Float)
    net_emission_before: Mapped[float | None] = mapped_column(Float)
    monthly_net_emission_before: Mapped[float | None] = mapped_column(Float)
    per_capita_emission_before: Mapped[float | None] = mapped_column(Float)
    previous_net_emission: Mapped[float | None] = mapped_column(Float)
    net_emission_after: Mapped[float | None] = mapped_column(Float)
    emission_reduction: Mapped[float | None] = mapped_column(Float)
    sequestration_increase: Mapped[float | None] = mapped_column(Float)
    total_impact: Mapped[float | None] = mapped_column(Float)
    reduction_pct: Mapped[float | None] = mapped_column(Float)

    village = relationship("Village", back_populates="budget")


class EmissionSource(Base):
    """emissions.csv: annual emissions per sector/source."""

    __tablename__ = "emission_sources"
    __table_args__ = (UniqueConstraint("vlcode", "sector", "source"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    vlcode: Mapped[str] = mapped_column(village_fk(), index=True)
    sector: Mapped[str] = mapped_column(String(64))
    source: Mapped[str] = mapped_column(String(128))
    emission_kg: Mapped[float] = mapped_column(Float)

    village = relationship("Village", back_populates="emissions")


class Intervention(Base):
    """interventions.csv: annual reduction potential of each proposed intervention."""

    __tablename__ = "interventions"
    __table_args__ = (UniqueConstraint("vlcode", "name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    vlcode: Mapped[str] = mapped_column(village_fk(), index=True)
    sector: Mapped[str] = mapped_column(String(64))
    name: Mapped[str] = mapped_column(String(128))
    reduction_kg: Mapped[float] = mapped_column(Float)

    village = relationship("Village", back_populates="interventions")


class Sequestration(Base):
    """sequestration.csv: existing sinks ("before") and proposed measures ("after")."""

    __tablename__ = "sequestration"
    __table_args__ = (UniqueConstraint("vlcode", "phase", "measure"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    vlcode: Mapped[str] = mapped_column(village_fk(), index=True)
    phase: Mapped[str] = mapped_column(String(16))  # "before" | "after"
    measure: Mapped[str] = mapped_column(String(128))
    area_ha: Mapped[float | None] = mapped_column(Float)
    co2_kg: Mapped[float] = mapped_column(Float)

    village = relationship("Village", back_populates="sequestration")


class ScenarioProjection(Base):
    """scenario.csv: projected net emissions per scenario (BAU / LOS / ACC) and year."""

    __tablename__ = "scenario_projections"
    __table_args__ = (UniqueConstraint("vlcode", "scenario", "year"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    vlcode: Mapped[str] = mapped_column(village_fk(), index=True)
    scenario: Mapped[str] = mapped_column(String(16))
    year: Mapped[int] = mapped_column(Integer)
    emission_kg: Mapped[float] = mapped_column(Float)

    village = relationship("Village", back_populates="scenarios")


class ActivityRecord(Base):
    """Monthly_Activity_Wide.csv: activity data the emissions are computed from."""

    __tablename__ = "activity_records"
    __table_args__ = (UniqueConstraint("vlcode", "activity"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    vlcode: Mapped[str] = mapped_column(village_fk(), index=True)
    activity: Mapped[str] = mapped_column(String(128))
    unit: Mapped[str] = mapped_column(String(32))
    value: Mapped[float | None] = mapped_column(Float)

    village = relationship("Village", back_populates="activities")


class EmissionFactor(Base):
    """Emission_Factors.csv: reference factors (stored as text, they are ranges)."""

    __tablename__ = "emission_factors"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(64), unique=True)
    emission_factor: Mapped[str] = mapped_column(String(128))
    source: Mapped[str | None] = mapped_column(String(128))
