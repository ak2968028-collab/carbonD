from datetime import datetime

from pydantic import BaseModel, Field


class LocationBase(BaseModel):
    name: str = Field(max_length=255)
    description: str | None = None
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class LocationRead(LocationBase):
    id: int
    created_at: datetime
