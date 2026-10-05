"""Load village + carbon CSVs into the database (safe to re-run: it replaces the data).

Run inside the backend container, after `alembic upgrade head`:
    docker compose exec backend python script/load_village_data.py

Sources:
    media/village_data/Village_india_updated.csv   -> villages
    media/Data/budget.csv                          -> carbon_budgets
    media/Data/emissions.csv                       -> emission_sources
    media/Data/interventions.csv                   -> interventions
    media/Data/sequestration.csv                   -> sequestration
    media/Data/scenario.csv                        -> scenario_projections
    media/Data/Monthly_Activity_Wide.csv           -> activity_records
    media/Data/Emission_Factors.csv                -> emission_factors
"""
import csv
import re
from pathlib import Path

from sqlalchemy import create_engine, delete
from sqlalchemy.orm import Session

from app.conf.settings import settings
from app.database.models import (
    ActivityRecord,
    CarbonBudget,
    EmissionFactor,
    EmissionSource,
    Intervention,
    ScenarioProjection,
    Sequestration,
    Village,
)

MEDIA = Path(settings.BASE_DIR, "media")
VILLAGE_CSV = MEDIA / "village_data" / "Village_india_updated.csv"
DATA = MEDIA / "Data"

SYNC_URL = settings.database_url.replace("+asyncpg", "+psycopg2")

# budget.csv column -> CarbonBudget field
BUDGET_COLUMNS = {
    "before_total_emission": "total_emission_before",
    "before_total_sequestration": "total_sequestration_before",
    "before_net_emission": "net_emission_before",
    "before_net_monthly_emission": "monthly_net_emission_before",
    "before_per_capita_emission": "per_capita_emission_before",
    "after_previous_net_emission": "previous_net_emission",
    "after_new_net_emission": "net_emission_after",
    "after_total_emission_reduction": "emission_reduction",
    "after_total_sequestration_increase": "sequestration_increase",
    "after_total_impact_reduction_+_sequestration": "total_impact",
    "after_percentage_reduction_pct": "reduction_pct",
}

# interventions.csv headers are truncated in the source file; map them to readable names
INTERVENTIONS = {
    "Agriculture_Rice_Methane_Reducti": ("Agriculture", "Rice methane reduction"),
    "Biomass_Improved_Cookstove_(": ("Biomass", "Improved cookstoves"),
    "Cooking_LPG_Efficiency_(10%)": ("Cooking", "LPG efficiency (10%)"),
    "Energy_Solar_Rooftop_(500_M": ("Energy", "Solar rooftop"),
    "Transport_EV_Adoption_(20%)": ("Transport", "EV adoption (20%)"),
    "Waste_Composting_(30%)": ("Waste", "Composting (30%)"),
}

# sequestration.csv "after_*" headers -> (measure, area in ha)
SEQUESTRATION_AFTER = {
    "after_Agroforestry_Tree_Plantation_15ha_seq_kg": ("Agroforestry tree plantation", 15),
    "after_Forestry_Afforestation_(_10ha_seq_kg": ("Afforestation", 10),
    "after_Green Belt_Village_Plantat_5ha_seq_kg": ("Green belt village plantation", 5),
    "after_Soil Carbon_Organic_Farming_20ha_seq_kg": ("Soil carbon (organic farming)", 20),
}

# Monthly_Activity_Wide.csv header -> (activity, unit)
ACTIVITIES = {
    "Electricity_Consumption_kWh": ("Electricity consumption", "kWh"),
    "Firewood_Consumption_kg": ("Firewood consumption", "kg"),
    "LPG_Consumption_kg": ("LPG consumption", "kg"),
    "Livestock_Count": ("Livestock", "count"),
    "Petrol_Consumption_Litres": ("Petrol consumption", "L"),
    "Solid_Waste_kg": ("Solid waste", "kg"),
    "Vehicles_(2-wheelers)_Count": ("Two-wheelers", "count"),
}

SCENARIO_COLUMN = re.compile(r"^(?P<scenario>[A-Z]+)_(?P<year>\d{4})$")


def read_csv(path: Path) -> list[dict]:
    # utf-8-sig strips the BOM some of these files start with
    with open(path, newline="", encoding="utf-8-sig") as f:
        return [{k.strip(): (v or "").strip() for k, v in row.items()} for row in csv.DictReader(f)]


def num(value: str) -> float | None:
    return float(value) if value not in ("", None) else None


def load_villages(db: Session) -> set[str]:
    rows = read_csv(VILLAGE_CSV)
    db.add_all(
        Village(
            vlcode=r["village_code"],
            name=r["village_name"],
            subdistrict_code=r["subdistrict_code"] or None,
            population_2011=int(float(r["population_2011"])) if r["population_2011"] else None,
        )
        for r in rows
    )
    print(f"[✓] villages: {len(rows)}")
    return {r["village_code"] for r in rows}


def ensure_village(db: Session, known: set[str], vlcode: str, name: str) -> None:
    """Carbon files may reference villages missing from the village CSV; add them by name."""
    if vlcode not in known:
        db.add(Village(vlcode=vlcode, name=name))
        known.add(vlcode)
        print(f"[!] village {vlcode} ({name}) is not in {VILLAGE_CSV.name}; added from carbon data")


def load_carbon(db: Session, known: set[str]) -> None:
    budget = read_csv(DATA / "budget.csv")
    for r in budget:
        ensure_village(db, known, r["vlcode"], r["village_name"])
    db.flush()
    db.add_all(
        CarbonBudget(vlcode=r["vlcode"], **{field: num(r[col]) for col, field in BUDGET_COLUMNS.items()})
        for r in budget
    )
    print(f"[✓] carbon_budgets: {len(budget)}")

    count = 0
    for r in read_csv(DATA / "emissions.csv"):
        ensure_village(db, known, r["vlcode"], r["village_name"])
        for col, value in r.items():
            if col in ("vlcode", "village_name") or num(value) is None:
                continue
            sector, source = col.split("_", 1)
            db.add(EmissionSource(vlcode=r["vlcode"], sector=sector, source=source, emission_kg=num(value)))
            count += 1
    print(f"[✓] emission_sources: {count}")

    count = 0
    for r in read_csv(DATA / "interventions.csv"):
        ensure_village(db, known, r["vlcode"], r["village_name"])
        for col, (sector, name) in INTERVENTIONS.items():
            if num(r.get(col, "")) is not None:
                db.add(Intervention(vlcode=r["vlcode"], sector=sector, name=name, reduction_kg=num(r[col])))
                count += 1
    print(f"[✓] interventions: {count}")

    count = 0
    for r in read_csv(DATA / "sequestration.csv"):
        ensure_village(db, known, r["vlcode"], r["village_name"])
        db.add(Sequestration(
            vlcode=r["vlcode"], phase="before", measure="Existing forest cover",
            area_ha=num(r["before_Forest Cover_area_ha"]),
            co2_kg=num(r["before_Forest Cover_annual_co2_sequestered_kg"]) or 0,
        ))
        count += 1
        for col, (measure, area) in SEQUESTRATION_AFTER.items():
            if num(r.get(col, "")) is not None:
                db.add(Sequestration(vlcode=r["vlcode"], phase="after", measure=measure, area_ha=area, co2_kg=num(r[col])))
                count += 1
    print(f"[✓] sequestration: {count}")

    count = 0
    for r in read_csv(DATA / "scenario.csv"):
        ensure_village(db, known, r["vlcode"], r["village_name"])
        for col, value in r.items():
            m = SCENARIO_COLUMN.match(col)
            if m and num(value) is not None:
                db.add(ScenarioProjection(
                    vlcode=r["vlcode"], scenario=m["scenario"], year=int(m["year"]), emission_kg=num(value),
                ))
                count += 1
    print(f"[✓] scenario_projections: {count}")

    count = 0
    for r in read_csv(DATA / "Monthly_Activity_Wide.csv"):
        ensure_village(db, known, r["vlcode"], r["village_name"])
        for col, (activity, unit) in ACTIVITIES.items():
            db.add(ActivityRecord(vlcode=r["vlcode"], activity=activity, unit=unit, value=num(r.get(col, ""))))
            count += 1
    print(f"[✓] activity_records: {count}")

    factors = read_csv(DATA / "Emission_Factors.csv")
    db.add_all(EmissionFactor(category=r["category"], emission_factor=r["emission_factor"], source=r["source"] or None)
               for r in factors)
    print(f"[✓] emission_factors: {len(factors)}")


def main() -> None:
    engine = create_engine(SYNC_URL)
    with Session(engine) as db, db.begin():
        # Children first, then villages; everything is reloaded in one transaction
        for model in (CarbonBudget, EmissionSource, Intervention, Sequestration,
                      ScenarioProjection, ActivityRecord, EmissionFactor, Village):
            db.execute(delete(model))
        known = load_villages(db)
        db.flush()
        load_carbon(db, known)
    print("Done.")


if __name__ == "__main__":
    main()
