"""
Parameter Service
Business logic for parameter catalog operations
"""

import logging
from typing import Any

from app.repositories.parameter_repository import parameter_repository
from app.models.parameter import ParameterData, CreateParameterRequest, UpdateParameterRequest

logger = logging.getLogger(__name__)


class ParameterService:
    """Service for parameter catalog operations."""

    async def get_parameter_by_id(self, parameter_id: str) -> ParameterData | None:
        """Get parameter by ID."""
        try:
            return await parameter_repository.find_by_id(parameter_id)
        except Exception as e:
            logger.error(f"Error getting parameter by ID: {e}")
            raise

    async def get_parameter_by_name(self, name: str) -> ParameterData | None:
        """Get parameter by name."""
        try:
            return await parameter_repository.find_by_name(name)
        except Exception as e:
            logger.error(f"Error getting parameter by name: {e}")
            raise

    async def get_all_parameters(self) -> list[ParameterData]:
        """Get all parameters."""
        try:
            return await parameter_repository.find_all()
        except Exception as e:
            logger.error(f"Error getting all parameters: {e}")
            raise

    async def get_parameters_by_type(self, param_type: str) -> list[ParameterData]:
        """Get parameters by type."""
        try:
            return await parameter_repository.find_by_type(param_type)
        except Exception as e:
            logger.error(f"Error getting parameters by type: {e}")
            raise

    async def get_parameters_by_category(self, category: str) -> list[ParameterData]:
        """Get parameters by category."""
        try:
            return await parameter_repository.find_by_category(category)
        except Exception as e:
            logger.error(f"Error getting parameters by category: {e}")
            raise

    async def get_active_parameters(self) -> list[ParameterData]:
        """Get active parameters."""
        try:
            return await parameter_repository.find_active()
        except Exception as e:
            logger.error(f"Error getting active parameters: {e}")
            raise

    async def create_parameter(self, param_data: CreateParameterRequest | dict[str, Any]) -> ParameterData:
        """Create new parameter."""
        try:
            return await parameter_repository.create(param_data)
        except Exception as e:
            logger.error(f"Error creating parameter: {e}")
            raise

    async def update_parameter(
        self,
        parameter_id: str,
        param_data: UpdateParameterRequest | dict[str, Any],
    ) -> ParameterData:
        """Update parameter."""
        try:
            return await parameter_repository.update(parameter_id, param_data)
        except Exception as e:
            logger.error(f"Error updating parameter: {e}")
            raise

    async def delete_parameter(self, parameter_id: str) -> None:
        """Delete parameter."""
        try:
            await parameter_repository.delete(parameter_id)
        except Exception as e:
            logger.error(f"Error deleting parameter: {e}")
            raise

    async def get_categories(self) -> list[str]:
        """Get all unique categories."""
        try:
            return await parameter_repository.get_categories()
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            raise

    async def get_parameter_catalog(self) -> dict[str, list[dict[str, Any]]]:
        """Get full parameter catalog grouped by type."""
        try:
            all_params = await parameter_repository.find_all()
            catalog = {
                "structured": [],
                "narrative": [],
                "guardrail": [],
            }

            for param in all_params:
                param_dict = param.model_dump()
                if param.type in catalog:
                    catalog[param.type].append(param_dict)

            return catalog
        except Exception as e:
            logger.error(f"Error getting parameter catalog: {e}")
            raise

    async def reset_parameters(self, param_type: str | None = None) -> None:
        """Reset parameters (delete all of a type or all)."""
        try:
            if param_type:
                await parameter_repository.delete_by_type(param_type)
            else:
                # Delete all parameters
                for ptype in ["structured", "narrative", "guardrail"]:
                    await parameter_repository.delete_by_type(ptype)
        except Exception as e:
            logger.error(f"Error resetting parameters: {e}")
            raise


# Singleton instance
parameter_service = ParameterService()
