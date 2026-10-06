from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.conf.settings import settings
from app.database.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tables are managed by Alembic migrations (see alembic/), not created here
    yield
    await engine.dispose()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Allowed browser origins (backend/.backenddb.env):
#   CORS_ORIGINS       exact list: localhost dev servers + https://carbon-d.vercel.app
#   CORS_ORIGIN_REGEX  carbon-d-*.vercel.app previews + *.trycloudflare.com
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    return {"message": "DashBoard API is running"}
