from fastapi import APIRouter, Depends

from app.api.routes import auth, carbon, health, locations, villages
from app.dependencies.auth import get_current_user

api_router = APIRouter()

# Public
api_router.include_router(health.router)
api_router.include_router(auth.router)

# Everything below needs a valid bearer token
protected = [Depends(get_current_user)]
api_router.include_router(villages.router, dependencies=protected)
api_router.include_router(carbon.router, dependencies=protected)
api_router.include_router(locations.router, dependencies=protected)
