"""
File-Based Competency Repository
Reads/writes competencies from JSON files instead of database
"""

import logging
from typing import Any
from uuid import uuid4

from app.utils.file_storage import read_json_file, write_json_file
from app.models.competency import CompetencyData, CreateCompetencyRequest, UpdateCompetencyRequest

logger = logging.getLogger(__name__)

COMPETENCIES_FILE = "competencies.json"


class FileCompetencyRepository:
    """File-based repository for competency operations."""

    def _load_competencies(self) -> list[dict[str, Any]]:
        """Load competencies from JSON file."""
        return read_json_file(COMPETENCIES_FILE) or []

    def _save_competencies(self, competencies: list[dict[str, Any]]) -> None:
        """Save competencies to JSON file."""
        write_json_file(COMPETENCIES_FILE, competencies)

    async def find_by_id(self, competency_id: str) -> CompetencyData | None:
        """Find competency by ID."""
        try:
            competencies = self._load_competencies()
            for comp in competencies:
                if comp.get("id") == competency_id:
                    return CompetencyData(**comp)
            return None
        except Exception as e:
            logger.error(f"Error finding competency by ID: {e}")
            raise

    async def find_all(self) -> list[CompetencyData]:
        """Get all competencies."""
        try:
            competencies = self._load_competencies()
            return [CompetencyData(**comp) for comp in competencies]
        except Exception as e:
            logger.error(f"Error fetching all competencies: {e}")
            raise

    async def find_by_industry(self, industry: str) -> list[CompetencyData]:
        """Find competencies by industry."""
        try:
            competencies = self._load_competencies()
            filtered = [
                comp for comp in competencies
                if comp.get("industry") == industry or comp.get("industry") is None
            ]
            return [CompetencyData(**comp) for comp in filtered]
        except Exception as e:
            logger.error(f"Error finding competencies by industry: {e}")
            raise

    async def find_by_category(self, category: str) -> list[CompetencyData]:
        """Find competencies by category."""
        try:
            competencies = self._load_competencies()
            filtered = [comp for comp in competencies if comp.get("category") == category]
            return [CompetencyData(**comp) for comp in filtered]
        except Exception as e:
            logger.error(f"Error finding competencies by category: {e}")
            raise

    async def create(self, competency_data: CreateCompetencyRequest | dict[str, Any]) -> CompetencyData:
        """Create a new competency."""
        try:
            if isinstance(competency_data, CreateCompetencyRequest):
                data = competency_data.model_dump()
            else:
                data = competency_data

            competencies = self._load_competencies()

            new_competency = {
                "id": str(uuid4()),
                **data,
            }
            competencies.append(new_competency)
            self._save_competencies(competencies)

            return CompetencyData(**new_competency)
        except Exception as e:
            logger.error(f"Error creating competency: {e}")
            raise

    async def update(self, competency_id: str, competency_data: UpdateCompetencyRequest | dict[str, Any]) -> CompetencyData:
        """Update a competency."""
        try:
            if isinstance(competency_data, UpdateCompetencyRequest):
                data = competency_data.model_dump(exclude_unset=True)
            else:
                data = {k: v for k, v in competency_data.items() if v is not None}

            competencies = self._load_competencies()
            for i, comp in enumerate(competencies):
                if comp.get("id") == competency_id:
                    competencies[i] = {**comp, **data}
                    self._save_competencies(competencies)
                    return CompetencyData(**competencies[i])

            raise ValueError("Competency not found")
        except Exception as e:
            logger.error(f"Error updating competency: {e}")
            raise

    async def delete(self, competency_id: str) -> None:
        """Delete a competency."""
        try:
            competencies = self._load_competencies()
            competencies = [comp for comp in competencies if comp.get("id") != competency_id]
            self._save_competencies(competencies)
        except Exception as e:
            logger.error(f"Error deleting competency: {e}")
            raise


# Singleton instance
file_competency_repository = FileCompetencyRepository()
