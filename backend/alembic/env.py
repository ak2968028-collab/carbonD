import asyncio
from logging.config import fileConfig

from alembic import context
from geoalchemy2 import alembic_helpers
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from app.conf.settings import settings
from app.database import models  # noqa: F401  (registers tables on Base.metadata)
from app.database.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def include_object(object, name, type_, reflected, compare_to):
    # Only manage tables defined in our models. The database also holds PostGIS
    # tables (spatial_ref_sys, tiger geocoder, topology) that must never be dropped.
    # Side effect: removing a model won't autogenerate a drop_table; write that by hand.
    if type_ == "table" and reflected and compare_to is None:
        return False
    return alembic_helpers.include_object(object, name, type_, reflected, compare_to)


def _configure_kwargs() -> dict:
    return dict(
        target_metadata=target_metadata,
        include_object=include_object,
        # Handle Geometry columns and their spatial indexes correctly in autogenerate
        process_revision_directives=alembic_helpers.writer,
        render_item=alembic_helpers.render_item,
        compare_type=True,
    )


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        **_configure_kwargs(),
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, **_configure_kwargs())
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(settings.database_url, poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
