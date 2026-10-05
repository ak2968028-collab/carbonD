from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "DashBoard API"
    API_PREFIX: str = "/api"
    BASE_DIR: str = "/home/app"

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "database"
    POSTGRES_PORT: int = 5432

    GEOSERVER_URL: str = "http://geoserver:8080/geoserver"
    GEOSERVER_USERNAME: str = "admin"
    GEOSERVER_PASSWORD: str = "geoserver"
    GEOSERVER_WORKSPACE: str = "dashboard"
    # Layer names as published by script/push_to_geoserver.py
    GEOSERVER_VILLAGE_LAYER: str = "Village_india"
    GEOSERVER_BASIN_LAYER: str = "basin_boundary"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Comma-separated list of allowed frontend origins
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3200,https://carbon-d.vercel.app"
    # Optional regex for extra origins, e.g. ^https://carbon-d-[a-z0-9-]+\.vercel\.app$ for Vercel previews
    CORS_ORIGIN_REGEX: str | None = None

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
