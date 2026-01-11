"""
Industry Service
Business logic for industry settings operations
"""

import logging
from typing import Any

from app.repositories.file_industry_repository import file_industry_repository

logger = logging.getLogger(__name__)


class IndustryService:
    """Service for industry settings operations."""

    async def get_industry_competencies(self) -> Any:
        """Get all industry competencies mappings."""
        try:
            return await file_industry_repository.get_industry_competencies()
        except Exception as e:
            logger.error(f"Error getting industry competencies: {e}")
            raise

    async def get_industry_metadata(self) -> Any:
        """Get industry metadata."""
        try:
            return await file_industry_repository.get_industry_metadata()
        except Exception as e:
            logger.error(f"Error getting industry metadata: {e}")
            raise

    async def get_difficulty_settings(self) -> Any:
        """Get difficulty settings."""
        try:
            return await file_industry_repository.get_difficulty_settings()
        except Exception as e:
            logger.error(f"Error getting difficulty settings: {e}")
            raise

    async def save_industry_competencies(self, data: Any) -> None:
        """Save industry competencies mappings."""
        try:
            await file_industry_repository.save_industry_competencies(data)
        except Exception as e:
            logger.error(f"Error saving industry competencies: {e}")
            raise

    async def save_industry_metadata(self, data: Any) -> None:
        """Save industry metadata."""
        try:
            await file_industry_repository.save_industry_metadata(data)
        except Exception as e:
            logger.error(f"Error saving industry metadata: {e}")
            raise

    async def save_difficulty_settings(self, data: Any) -> None:
        """Save difficulty settings."""
        try:
            await file_industry_repository.save_difficulty_settings(data)
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
            await file_industry_repository.update_industry_subcategory_competencies(
                industry,
                subcategory,
                competency_ids,
            )
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
            await file_industry_repository.update_focus_area_competencies(
                industry,
                subcategory,
                focus_area,
                competency_ids,
                enabled,
            )
        except Exception as e:
            logger.error(f"Error updating focus area competencies: {e}")
            raise

    async def get_industries_list(self) -> list[dict[str, Any]]:
        """Get list of industries with metadata."""
        try:
            metadata = await file_industry_repository.get_industry_metadata()
            industries = []
            for industry_id, industry_data in metadata.items():
                industries.append({
                    "id": industry_id,
                    "name": industry_data.get("displayName", industry_id),
                    "subcategories": list(industry_data.get("subcategories", {}).keys()),
                })
            return industries
        except Exception as e:
            logger.error(f"Error getting industries list: {e}")
            raise

    async def get_subcategories(self, industry: str) -> list[dict[str, Any]]:
        """Get subcategories for an industry."""
        try:
            metadata = await file_industry_repository.get_industry_metadata()
            industry_data = metadata.get(industry, {})
            subcategories = []
            for subcat_id, subcat_data in industry_data.get("subcategories", {}).items():
                subcategories.append({
                    "id": subcat_id,
                    "name": subcat_data.get("displayName", subcat_id),
                    "focusAreas": list(subcat_data.get("focusAreas", {}).keys()),
                })
            return subcategories
        except Exception as e:
            logger.error(f"Error getting subcategories: {e}")
            raise


# Singleton instance
industry_service = IndustryService()
