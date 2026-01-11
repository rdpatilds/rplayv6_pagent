"""
Database Connection Manager
Handles PostgreSQL connection using asyncpg with connection pooling
"""

import logging
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

import asyncpg

from app.config import get_settings

logger = logging.getLogger(__name__)


class DatabasePool:
    """Database connection pool manager."""

    _pool: asyncpg.Pool | None = None
    _initialized: bool = False

    @classmethod
    async def initialize(cls) -> None:
        """Initialize the connection pool."""
        if cls._initialized:
            return

        settings = get_settings()
        if not settings.database_url:
            logger.error("DATABASE_URL not set")
            raise ValueError("DATABASE_URL environment variable is required")

        try:
            # Parse connection string and create pool
            cls._pool = await asyncpg.create_pool(
                dsn=settings.database_url,
                min_size=2,
                max_size=20,
                command_timeout=60,
                statement_cache_size=0,  # Disable statement caching for Neon serverless
            )
            cls._initialized = True
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise

    @classmethod
    async def close(cls) -> None:
        """Close the connection pool."""
        if cls._pool:
            await cls._pool.close()
            cls._pool = None
            cls._initialized = False
            logger.info("Database connection pool closed")

    @classmethod
    def get_pool(cls) -> asyncpg.Pool:
        """Get the connection pool."""
        if not cls._pool:
            raise RuntimeError("Database pool not initialized. Call initialize() first.")
        return cls._pool


@asynccontextmanager
async def get_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """
    Get a database connection from the pool.

    Usage:
        async with get_connection() as conn:
            result = await conn.fetch("SELECT * FROM users")
    """
    pool = DatabasePool.get_pool()
    async with pool.acquire() as conn:
        yield conn


async def execute(query: str, *args: Any) -> str:
    """Execute a query without returning rows."""
    async with get_connection() as conn:
        return await conn.execute(query, *args)


async def fetch(query: str, *args: Any) -> list[asyncpg.Record]:
    """Fetch multiple rows."""
    async with get_connection() as conn:
        return await conn.fetch(query, *args)


async def fetchone(query: str, *args: Any) -> asyncpg.Record | None:
    """Fetch a single row."""
    async with get_connection() as conn:
        return await conn.fetchrow(query, *args)


async def fetchval(query: str, *args: Any) -> Any:
    """Fetch a single value."""
    async with get_connection() as conn:
        return await conn.fetchval(query, *args)


def record_to_dict(record: asyncpg.Record | None) -> dict[str, Any] | None:
    """Convert asyncpg Record to dictionary, converting UUID types to strings."""
    if record is None:
        return None
    result = {}
    for key, value in dict(record).items():
        # Convert UUID to string
        if hasattr(value, 'hex'):  # UUID objects have hex attribute
            result[key] = str(value)
        else:
            result[key] = value
    return result


def records_to_list(records: list[asyncpg.Record]) -> list[dict[str, Any]]:
    """Convert list of asyncpg Records to list of dictionaries."""
    return [record_to_dict(r) for r in records]


async def test_connection() -> bool:
    """Test database connection."""
    try:
        result = await fetchval("SELECT 1")
        return result == 1
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False


# Alias for compatibility
sql = None  # Placeholder for the TypeScript sql template tag pattern


class SQLHelper:
    """
    Helper class providing a similar interface to the TypeScript sql template tag.
    Supports parameterized queries with PostgreSQL-style $1, $2 placeholders.
    """

    @staticmethod
    async def query(query_str: str, *args: Any) -> list[dict[str, Any]]:
        """Execute query and return results as list of dicts."""
        records = await fetch(query_str, *args)
        return records_to_list(records)

    @staticmethod
    async def query_one(query_str: str, *args: Any) -> dict[str, Any] | None:
        """Execute query and return single result as dict."""
        record = await fetchone(query_str, *args)
        return record_to_dict(record)

    @staticmethod
    async def execute(query_str: str, *args: Any) -> str:
        """Execute a query without returning rows."""
        return await execute(query_str, *args)


# Create singleton instance
sql_helper = SQLHelper()
