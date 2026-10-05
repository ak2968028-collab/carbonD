from pydantic import BaseModel


class HealthRead(BaseModel):
    database: str
    postgis: str | None
    geoserver: str
