"""
Engagement Service
Business logic for engagement tracking operations
"""

import logging
from typing import Any

from app.repositories.engagement_repository import engagement_repository
from app.models.engagement import EngagementData, CreateEngagementRequest

logger = logging.getLogger(__name__)


class EngagementService:
    """Service for engagement tracking operations."""

    async def get_engagement_by_id(self, engagement_id: str) -> EngagementData | None:
        """Get engagement event by ID."""
        try:
            return await engagement_repository.find_by_id(engagement_id)
        except Exception as e:
            logger.error(f"Error getting engagement by ID: {e}")
            raise

    async def get_user_engagement(self, user_id: str) -> list[EngagementData]:
        """Get all engagement events for a user."""
        try:
            return await engagement_repository.find_by_user_id(user_id)
        except Exception as e:
            logger.error(f"Error getting user engagement: {e}")
            raise

    async def get_simulation_engagement(self, simulation_id: str) -> list[EngagementData]:
        """Get all engagement events for a simulation."""
        try:
            return await engagement_repository.find_by_simulation_id(simulation_id)
        except Exception as e:
            logger.error(f"Error getting simulation engagement: {e}")
            raise

    async def track_event(self, engagement_data: CreateEngagementRequest | dict[str, Any]) -> EngagementData:
        """Track engagement event."""
        try:
            return await engagement_repository.create(engagement_data)
        except Exception as e:
            logger.error(f"Error tracking engagement event: {e}")
            raise

    async def get_user_metrics(self, user_id: str) -> dict[str, Any]:
        """Get engagement metrics for a user."""
        try:
            return await engagement_repository.get_user_metrics(user_id)
        except Exception as e:
            logger.error(f"Error getting user metrics: {e}")
            raise

    async def delete_user_engagement(self, user_id: str) -> None:
        """Delete all engagement events for a user."""
        try:
            await engagement_repository.delete_by_user_id(user_id)
        except Exception as e:
            logger.error(f"Error deleting user engagement: {e}")
            raise

    async def delete_simulation_engagement(self, simulation_id: str) -> None:
        """Delete all engagement events for a simulation."""
        try:
            await engagement_repository.delete_by_simulation_id(simulation_id)
        except Exception as e:
            logger.error(f"Error deleting simulation engagement: {e}")
            raise


# Singleton instance
engagement_service = EngagementService()
