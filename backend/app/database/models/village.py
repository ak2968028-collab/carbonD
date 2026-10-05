from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Village(Base):
    """One row per village (media/village_data/Village_india_updated.csv).

    vlcode matches the `vlcode` attribute of the GeoServer village layer, which holds the boundary.
    """

    __tablename__ = "villages"

    vlcode: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    subdistrict_code: Mapped[str | None] = mapped_column(String(16), index=True)
    population_2011: Mapped[int | None] = mapped_column(Integer)

    budget = relationship("CarbonBudget", uselist=False, back_populates="village", cascade="all, delete-orphan")
    emissions = relationship("EmissionSource", back_populates="village", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="village", cascade="all, delete-orphan")
    sequestration = relationship("Sequestration", back_populates="village", cascade="all, delete-orphan")
    scenarios = relationship("ScenarioProjection", back_populates="village", cascade="all, delete-orphan")
    activities = relationship("ActivityRecord", back_populates="village", cascade="all, delete-orphan")
