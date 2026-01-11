"""
Competency Service
Business logic for competency operations
"""

import logging
from typing import Any

from app.repositories.competency_repository import competency_repository
from app.repositories.file_competency_repository import file_competency_repository
from app.models.competency import CompetencyData, CreateCompetencyRequest, UpdateCompetencyRequest

logger = logging.getLogger(__name__)


class CompetencyService:
    """Service for competency operations."""

    def __init__(self, use_file_repository: bool = True):
        """Initialize with either file or database repository."""
        self.repository = file_competency_repository if use_file_repository else competency_repository

    async def get_competency_by_id(self, competency_id: str) -> CompetencyData | None:
        """Get competency by ID."""
        try:
            return await self.repository.find_by_id(competency_id)
        except Exception as e:
            logger.error(f"Error getting competency by ID: {e}")
            raise

    async def get_all_competencies(self) -> list[CompetencyData]:
        """Get all competencies."""
        try:
            return await self.repository.find_all()
        except Exception as e:
            logger.error(f"Error getting all competencies: {e}")
            raise

    async def get_competencies_by_industry(self, industry: str) -> list[CompetencyData]:
        """Get competencies by industry."""
        try:
            return await self.repository.find_by_industry(industry)
        except Exception as e:
            logger.error(f"Error getting competencies by industry: {e}")
            raise

    async def get_competencies_by_category(self, category: str) -> list[CompetencyData]:
        """Get competencies by category."""
        try:
            return await self.repository.find_by_category(category)
        except Exception as e:
            logger.error(f"Error getting competencies by category: {e}")
            raise

    async def create_competency(self, competency_data: CreateCompetencyRequest | dict[str, Any]) -> CompetencyData:
        """Create new competency."""
        try:
            return await self.repository.create(competency_data)
        except Exception as e:
            logger.error(f"Error creating competency: {e}")
            raise

    async def update_competency(
        self,
        competency_id: str,
        competency_data: UpdateCompetencyRequest | dict[str, Any],
    ) -> CompetencyData:
        """Update competency."""
        try:
            return await self.repository.update(competency_id, competency_data)
        except Exception as e:
            logger.error(f"Error updating competency: {e}")
            raise

    async def delete_competency(self, competency_id: str) -> None:
        """Delete competency."""
        try:
            await self.repository.delete(competency_id)
        except Exception as e:
            logger.error(f"Error deleting competency: {e}")
            raise

    async def get_categories(self) -> list[str]:
        """Get all unique categories."""
        try:
            competencies = await self.repository.find_all()
            categories = set()
            for comp in competencies:
                if comp.category:
                    categories.add(comp.category)
            return sorted(list(categories))
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            raise


# Singleton instance
competency_service = CompetencyService(use_file_repository=True)
