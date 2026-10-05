from fastapi import APIRouter, Depends

from app.api.routes import auth, carbon, health, locations, villages
from app.dependencies.auth import get_current_user

api_router = APIRouter()

# Public: the dashboard can be browsed without signing in
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(villages.router)
api_router.include_router(carbon.router)

# Everything below needs a valid bearer token
protected = [Depends(get_current_user)]
api_router.include_router(locations.router, dependencies=protected)
