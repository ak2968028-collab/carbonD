def point_wkt(lon: float, lat: float, srid: int = 4326) -> str:
    """EWKT for a point, accepted directly by GeoAlchemy2 Geometry columns."""
    return f"SRID={srid};POINT({lon} {lat})"
