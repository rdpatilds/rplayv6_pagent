"""
File-Based Industry Repository
Reads/writes industry metadata and settings from JSON files
"""

import logging
from typing import Any

from app.utils.file_storage import read_json_file, write_json_file

logger = logging.getLogger(__name__)

INDUSTRY_COMPETENCIES_FILE = "industry-competencies.json"
INDUSTRY_METADATA_FILE = "industry-metadata.json"
DIFFICULTY_SETTINGS_FILE = "difficulty-settings.json"


class FileIndustryRepository:
    """File-based repository for industry operations."""

    async def get_industry_competencies(self) -> Any:
        """Get all industry competencies mappings."""
        try:
            return read_json_file(INDUSTRY_COMPETENCIES_FILE)
        except Exception as e:
            logger.error(f"Error fetching industry competencies: {e}")
            raise

    async def get_industry_metadata(self) -> Any:
        """Get industry metadata (display names, subcategories)."""
        try:
            return read_json_file(INDUSTRY_METADATA_FILE)
        except Exception as e:
            logger.error(f"Error fetching industry metadata: {e}")
            raise

    async def get_difficulty_settings(self) -> Any:
        """Get difficulty settings."""
        try:
            return read_json_file(DIFFICULTY_SETTINGS_FILE)
        except Exception as e:
            logger.error(f"Error fetching difficulty settings: {e}")
            raise

    async def save_industry_competencies(self, data: Any) -> None:
        """Save industry competencies mappings."""
        try:
            write_json_file(INDUSTRY_COMPETENCIES_FILE, data)
        except Exception as e:
            logger.error(f"Error saving industry competencies: {e}")
            raise

    async def save_industry_metadata(self, data: Any) -> None:
        """Save industry metadata."""
        try:
            write_json_file(INDUSTRY_METADATA_FILE, data)
        except Exception as e:
            logger.error(f"Error saving industry metadata: {e}")
            raise

    async def save_difficulty_settings(self, data: Any) -> None:
        """Save difficulty settings."""
        try:
            write_json_file(DIFFICULTY_SETTINGS_FILE, data)
        except Exception as e:
            logger.error(f"Error saving difficulty settings: {e}")
            raise

    async def update_industry_subcategory_competencies(
        self,
        industry: str,
        subcategory: str,
        competency_ids: list[str],
    ) -> None:
        """Update competencies for specific industry/subcategory."""
        try:
            data = await self.get_industry_competencies()

            if industry not in data:
                data[industry] = {}

            if subcategory not in data[industry]:
                data[industry][subcategory] = {}

            # Update competencies
            data[industry][subcategory]["competencies"] = competency_ids

            await self.save_industry_competencies(data)
        except Exception as e:
            logger.error(f"Error updating industry subcategory competencies: {e}")
            raise

    async def update_focus_area_competencies(
        self,
        industry: str,
        subcategory: str,
        focus_area: str,
        competency_ids: list[str],
        enabled: bool = True,
    ) -> None:
        """Update focus area competencies."""
        try:
            data = await self.get_industry_competencies()

            if not data.get(industry, {}).get(subcategory, {}).get("focusAreas"):
                raise ValueError(f"Focus areas not found for {industry}/{subcategory}")

            if focus_area not in data[industry][subcategory]["focusAreas"]:
                data[industry][subcategory]["focusAreas"][focus_area] = {}

            data[industry][subcategory]["focusAreas"][focus_area]["competencies"] = competency_ids
            data[industry][subcategory]["focusAreas"][focus_area]["enabled"] = enabled

            await self.save_industry_competencies(data)
        except Exception as e:
            logger.error(f"Error updating focus area competencies: {e}")
            raise


# Singleton instance
file_industry_repository = FileIndustryRepository()
