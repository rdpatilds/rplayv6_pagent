"""
Engagement Repository
Database operations for engagement tracking entities
"""

import json
import logging
from typing import Any
from uuid import uuid4

from app.database import fetch, fetchone, execute, record_to_dict
from app.models.engagement import EngagementData, CreateEngagementRequest

logger = logging.getLogger(__name__)


class EngagementRepository:
    """Repository for engagement database operations."""

    async def find_by_id(self, engagement_id: str) -> EngagementData | None:
        """Find engagement event by ID."""
        try:
            query = """
                SELECT id, user_id, simulation_id, event_type, event_data, timestamp, created_at, updated_at
                FROM engagement_events WHERE id = $1
            """
            record = await fetchone(query, engagement_id)
            if not record:
                return None
            data = self._parse_json_fields(record_to_dict(record))
            return EngagementData(**data)
        except Exception as e:
            logger.error(f"Error finding engagement by ID: {e}")
            raise

    async def find_by_user_id(self, user_id: str) -> list[EngagementData]:
        """Find all engagement events for a user."""
        try:
            query = """
                SELECT id, user_id, simulation_id, event_type, event_data, timestamp, created_at, updated_at
                FROM engagement_events WHERE user_id = $1
                ORDER BY created_at DESC
            """
            records = await fetch(query, user_id)
            return [EngagementData(**self._parse_json_fields(dict(r))) for r in records]
        except Exception as e:
            logger.error(f"Error finding engagement by user ID: {e}")
            raise

    async def find_by_simulation_id(self, simulation_id: str) -> list[EngagementData]:
        """Find all engagement events for a simulation."""
        try:
            query = """
                SELECT id, user_id, simulation_id, event_type, event_data, timestamp, created_at, updated_at
                FROM engagement_events WHERE simulation_id = $1
                ORDER BY created_at ASC
            """
            records = await fetch(query, simulation_id)
            return [EngagementData(**self._parse_json_fields(dict(r))) for r in records]
        except Exception as e:
            logger.error(f"Error finding engagement by simulation ID: {e}")
            raise

    async def find_by_event_type(self, event_type: str) -> list[EngagementData]:
        """Find all engagement events of a type."""
        try:
            query = """
                SELECT id, user_id, simulation_id, event_type, event_data, timestamp, created_at, updated_at
                FROM engagement_events WHERE event_type = $1
                ORDER BY created_at DESC
            """
            records = await fetch(query, event_type)
            return [EngagementData(**self._parse_json_fields(dict(r))) for r in records]
        except Exception as e:
            logger.error(f"Error finding engagement by event type: {e}")
            raise

    async def create(self, engagement_data: CreateEngagementRequest | dict[str, Any]) -> EngagementData:
        """Create a new engagement event."""
        try:
            if isinstance(engagement_data, CreateEngagementRequest):
                data = engagement_data.model_dump()
            else:
                data = engagement_data

            engagement_id = str(uuid4())
            query = """
                INSERT INTO engagement_events (id, user_id, simulation_id, event_type, event_data, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING id, user_id, simulation_id, event_type, event_data, timestamp, created_at, updated_at
            """
            event_data = data.get("event_data")
            if event_data and not isinstance(event_data, str):
                event_data = json.dumps(event_data)

            record = await fetchone(
                query,
                engagement_id,
                data["user_id"],
                data.get("simulation_id"),
                data["event_type"],
                event_data,
            )
            result_data = self._parse_json_fields(record_to_dict(record))
            return EngagementData(**result_data)
        except Exception as e:
            logger.error(f"Error creating engagement event: {e}")
            raise

    async def delete_by_simulation_id(self, simulation_id: str) -> None:
        """Delete all engagement events for a simulation."""
        try:
            query = "DELETE FROM engagement_events WHERE simulation_id = $1"
            await execute(query, simulation_id)
        except Exception as e:
            logger.error(f"Error deleting engagement by simulation ID: {e}")
            raise

    async def delete_by_user_id(self, user_id: str) -> None:
        """Delete all engagement events for a user."""
        try:
            query = "DELETE FROM engagement_events WHERE user_id = $1"
            await execute(query, user_id)
        except Exception as e:
            logger.error(f"Error deleting engagement by user ID: {e}")
            raise

    async def get_user_metrics(self, user_id: str) -> dict[str, Any]:
        """Get engagement metrics for a user."""
        try:
            query = """
                SELECT
                    COUNT(*) as total_events,
                    COUNT(CASE WHEN event_type = 'simulation_start' THEN 1 END) as simulations_started,
                    COUNT(CASE WHEN event_type = 'simulation_complete' THEN 1 END) as simulations_completed,
                    COUNT(CASE WHEN event_type = 'message_sent' THEN 1 END) as messages_sent
                FROM engagement_events WHERE user_id = $1
            """
            record = await fetchone(query, user_id)
            if not record:
                return {
                    "totalEvents": 0,
                    "simulationsStarted": 0,
                    "simulationsCompleted": 0,
                    "messagesSent": 0,
                    "avgSessionDuration": 0,
                    "completionRate": 0,
                }
            data = dict(record)
            simulations_started = data.get("simulations_started", 0)
            simulations_completed = data.get("simulations_completed", 0)
            completion_rate = (simulations_completed / simulations_started * 100) if simulations_started > 0 else 0

            return {
                "totalEvents": data.get("total_events", 0),
                "simulationsStarted": simulations_started,
                "simulationsCompleted": simulations_completed,
                "messagesSent": data.get("messages_sent", 0),
                "avgSessionDuration": 0,  # Would need more complex calculation
                "completionRate": completion_rate,
            }
        except Exception as e:
            logger.error(f"Error getting user metrics: {e}")
            raise

    def _parse_json_fields(self, data: dict[str, Any]) -> dict[str, Any]:
        """Parse JSON string fields."""
        if data.get("event_data") and isinstance(data["event_data"], str):
            try:
                data["event_data"] = json.loads(data["event_data"])
            except json.JSONDecodeError:
                pass
        return data


# Singleton instance
engagement_repository = EngagementRepository()
