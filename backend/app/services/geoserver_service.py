from typing import Any

import httpx
from fastapi import HTTPException, status

from app.conf.settings import settings

# Village layer attribute -> name returned by the API (the rest of the 71 columns are dropped)
CENSUS_FIELDS = {
    "vlcode": "vlcode",
    "village": "village",
    "gram_panch": "gram_panchayat",
    "block": "block",
    "subdistric": "subdistrict",
    "district": "district",
    "state_name": "state",
    "total_urba": "settlement_type",
    "total_hous": "households",
    "total_popu": "population",
    "total_male": "male",
    "total_fema": "female",
    "avg_househ": "avg_household_size",
    "total_geog": "area_ha",
    "forest_are": "forest_area_ha",
    "net_area_s": "net_sown_area_ha",
    "area_irrig": "irrigated_area_ha",
    "total_unir": "unirrigated_area_ha",
    "barren_unc": "barren_area_ha",
    "culturable": "culturable_waste_ha",
    "current_fa": "current_fallow_ha",
    "nearest_to": "nearest_town",
    "nearest__1": "nearest_town_km",
}


async def geoserver_status() -> str:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(
                f"{settings.GEOSERVER_URL}/rest/about/version.json",
                auth=(settings.GEOSERVER_USERNAME, settings.GEOSERVER_PASSWORD),
            )
        return "ok" if r.status_code == 200 else f"status {r.status_code}"
    except httpx.HTTPError as e:
        return f"unreachable: {e.__class__.__name__}"


async def _village_features(cql_filter: str, count: int, with_geometry: bool = True) -> list[dict[str, Any]]:
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": f"{settings.GEOSERVER_WORKSPACE}:{settings.GEOSERVER_VILLAGE_LAYER}",
        "outputFormat": "application/json",
        "srsName": "EPSG:4326",
        "count": count,
        "CQL_FILTER": cql_filter,
    }
    if not with_geometry:
        params["propertyName"] = "vlcode,village"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(f"{settings.GEOSERVER_URL}/{settings.GEOSERVER_WORKSPACE}/ows", params=params)
        r.raise_for_status()
        return r.json().get("features", [])
    except (httpx.HTTPError, ValueError) as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"GeoServer request failed: {e.__class__.__name__}")


def _census(properties: dict[str, Any]) -> dict[str, Any]:
    return {out: properties.get(src) for src, out in CENSUS_FIELDS.items()}


async def village_boundary(vlcode: str) -> dict[str, Any] | None:
    if not vlcode.isdigit():
        return None
    features = await _village_features(f"vlcode='{vlcode}'", count=1)
    if not features:
        return None
    f = features[0]
    return {"type": "Feature", "id": vlcode, "geometry": f["geometry"], "properties": _census(f["properties"])}


async def vlcode_at(lon: float, lat: float) -> str | None:
    features = await _village_features(f"INTERSECTS(the_geom,SRID=4326;POINT({lon} {lat}))", count=1, with_geometry=False)
    return features[0]["properties"]["vlcode"] if features else None
