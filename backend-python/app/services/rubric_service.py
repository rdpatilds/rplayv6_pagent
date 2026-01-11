"""
Rubric Service
Business logic for rubric operations
"""

import logging
from typing import Any

from app.repositories.rubric_repository import rubric_repository
from app.repositories.file_rubric_repository import file_rubric_repository
from app.models.rubric import RubricData, CreateRubricRequest, UpdateRubricRequest

logger = logging.getLogger(__name__)


class RubricService:
    """Service for rubric operations."""

    def __init__(self, use_file_repository: bool = True):
        """Initialize with either file or database repository."""
        self.repository = file_rubric_repository if use_file_repository else rubric_repository

    async def get_rubric_by_id(self, rubric_id: str) -> RubricData | None:
        """Get rubric by ID."""
        try:
            return await self.repository.find_by_id(rubric_id)
        except Exception as e:
            logger.error(f"Error getting rubric by ID: {e}")
            raise

    async def get_all_rubrics(self) -> list[RubricData]:
        """Get all rubrics."""
        try:
            return await self.repository.find_all()
        except Exception as e:
            logger.error(f"Error getting all rubrics: {e}")
            raise

    async def get_rubrics_by_competency_id(self, competency_id: str) -> list[RubricData]:
        """Get rubrics by competency ID."""
        try:
            return await self.repository.find_by_competency_id(competency_id)
        except Exception as e:
            logger.error(f"Error getting rubrics by competency ID: {e}")
            raise

    async def get_rubrics_by_difficulty_level(self, difficulty_level: int) -> list[RubricData]:
        """Get rubrics by difficulty level."""
        try:
            return await self.repository.find_by_difficulty_level(difficulty_level)
        except Exception as e:
            logger.error(f"Error getting rubrics by difficulty level: {e}")
            raise

    async def get_rubrics_by_competency_and_difficulty(
        self,
        competency_id: str,
        difficulty_level: int,
    ) -> list[RubricData]:
        """Get rubrics by competency and difficulty."""
        try:
            return await self.repository.find_by_competency_and_difficulty(competency_id, difficulty_level)
        except Exception as e:
            logger.error(f"Error getting rubrics by competency and difficulty: {e}")
            raise

    async def create_rubric(self, rubric_data: CreateRubricRequest | dict[str, Any]) -> RubricData:
        """Create new rubric."""
        try:
            return await self.repository.create(rubric_data)
        except Exception as e:
            logger.error(f"Error creating rubric: {e}")
            raise

    async def update_rubric(
        self,
        rubric_id: str,
        rubric_data: UpdateRubricRequest | dict[str, Any],
    ) -> RubricData:
        """Update rubric."""
        try:
            return await self.repository.update(rubric_id, rubric_data)
        except Exception as e:
            logger.error(f"Error updating rubric: {e}")
            raise

    async def delete_rubric(self, rubric_id: str) -> None:
        """Delete rubric."""
        try:
            await self.repository.delete(rubric_id)
        except Exception as e:
            logger.error(f"Error deleting rubric: {e}")
            raise

    async def bulk_create_rubrics(self, rubrics: list[CreateRubricRequest | dict[str, Any]]) -> list[RubricData]:
        """Bulk create rubrics."""
        try:
            return await self.repository.bulk_create(rubrics)
        except Exception as e:
            logger.error(f"Error bulk creating rubrics: {e}")
            raise


# Singleton instance
rubric_service = RubricService(use_file_repository=True)
