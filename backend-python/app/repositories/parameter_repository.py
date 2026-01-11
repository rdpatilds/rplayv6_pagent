"""
Parameter Repository
Database operations for parameter catalog entities
"""

import json
import logging
from typing import Any
from uuid import uuid4

from app.database import fetch, fetchone, execute, record_to_dict, records_to_list
from app.models.parameter import ParameterData, CreateParameterRequest, UpdateParameterRequest

logger = logging.getLogger(__name__)


class ParameterRepository:
    """Repository for parameter database operations."""

    async def find_by_id(self, parameter_id: str) -> ParameterData | None:
        """Find parameter by ID."""
        try:
            query = """
                SELECT id, name, type, value, description, category, is_active, metadata, created_at, updated_at
                FROM parameters WHERE id = $1
            """
            record = await fetchone(query, parameter_id)
            if not record:
                return None
            data = self._parse_json_fields(record_to_dict(record))
            return ParameterData(**data)
        except Exception as e:
            logger.error(f"Error finding parameter by ID: {e}")
            raise

    async def find_by_name(self, name: str) -> ParameterData | None:
        """Find parameter by name."""
        try:
            query = """
                SELECT id, name, type, value, description, category, is_active, metadata, created_at, updated_at
                FROM parameters WHERE name = $1
            """
            record = await fetchone(query, name)
            if not record:
                return None
            data = self._parse_json_fields(record_to_dict(record))
            return ParameterData(**data)
        except Exception as e:
            logger.error(f"Error finding parameter by name: {e}")
            raise

    async def find_all(self) -> list[ParameterData]:
        """Get all parameters."""
        try:
            query = """
                SELECT id, name, type, value, description, category, is_active, metadata, created_at, updated_at
                FROM parameters ORDER BY type, category, name
            """
            records = await fetch(query)
            return [ParameterData(**self._parse_json_fields(dict(r))) for r in records]
        except Exception as e:
            logger.error(f"Error fetching all parameters: {e}")
            raise

    async def find_by_type(self, param_type: str) -> list[ParameterData]:
        """Find parameters by type."""
        try:
            query = """
                SELECT id, name, type, value, description, category, is_active, metadata, created_at, updated_at
                FROM parameters WHERE type = $1
                ORDER BY category, name
            """
            records = await fetch(query, param_type)
            return [ParameterData(**self._parse_json_fields(dict(r))) for r in records]
        except Exception as e:
            logger.error(f"Error finding parameters by type: {e}")
            raise

    async def find_by_category(self, category: str) -> list[ParameterData]:
        """Find parameters by category."""
        try:
            query = """
                SELECT id, name, type, value, description, category, is_active, metadata, created_at, updated_at
                FROM parameters WHERE category = $1
                ORDER BY type, name
            """
            records = await fetch(query, category)
            return [ParameterData(**self._parse_json_fields(dict(r))) for r in records]
        except Exception as e:
            logger.error(f"Error finding parameters by category: {e}")
            raise

    async def find_active(self) -> list[ParameterData]:
        """Find active parameters."""
        try:
            query = """
                SELECT id, name, type, value, description, category, is_active, metadata, created_at, updated_at
                FROM parameters WHERE is_active = true
                ORDER BY type, category, name
            """
            records = await fetch(query)
            return [ParameterData(**self._parse_json_fields(dict(r))) for r in records]
        except Exception as e:
            logger.error(f"Error finding active parameters: {e}")
            raise

    async def create(self, param_data: CreateParameterRequest | dict[str, Any]) -> ParameterData:
        """Create a new parameter."""
        try:
            if isinstance(param_data, CreateParameterRequest):
                data = param_data.model_dump()
            else:
                data = param_data

            param_id = str(uuid4())
            query = """
                INSERT INTO parameters (id, name, type, value, description, category, is_active, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, name, type, value, description, category, is_active, metadata, created_at, updated_at
            """
            value = data.get("value")
            if value is not None and not isinstance(value, str):
                value = json.dumps(value)

            metadata = data.get("metadata")
            if metadata and not isinstance(metadata, str):
                metadata = json.dumps(metadata)

            record = await fetchone(
                query,
                param_id,
                data["name"],
                data["type"],
                value,
                data.get("description"),
                data.get("category"),
                data.get("is_active", True),
                metadata,
            )
            result_data = self._parse_json_fields(record_to_dict(record))
            return ParameterData(**result_data)
        except Exception as e:
            logger.error(f"Error creating parameter: {e}")
            raise

    async def update(self, param_id: str, param_data: UpdateParameterRequest | dict[str, Any]) -> ParameterData:
        """Update a parameter."""
        try:
            if isinstance(param_data, UpdateParameterRequest):
                data = param_data.model_dump(exclude_unset=True)
            else:
                data = {k: v for k, v in param_data.items() if v is not None}

            # Build dynamic update query
            update_parts = []
            params = [param_id]
            param_idx = 2

            for key, value in data.items():
                if key in ["value", "metadata"] and value is not None and not isinstance(value, str):
                    value = json.dumps(value)
                update_parts.append(f"{key} = ${param_idx}")
                params.append(value)
                param_idx += 1

            if not update_parts:
                return await self.find_by_id(param_id)

            update_parts.append("updated_at = NOW()")
            query = f"""
                UPDATE parameters SET {', '.join(update_parts)}
                WHERE id = $1
                RETURNING id, name, type, value, description, category, is_active, metadata, created_at, updated_at
            """
            record = await fetchone(query, *params)
            if not record:
                raise ValueError("Parameter not found")
            result_data = self._parse_json_fields(record_to_dict(record))
            return ParameterData(**result_data)
        except Exception as e:
            logger.error(f"Error updating parameter: {e}")
            raise

    async def delete(self, param_id: str) -> None:
        """Delete a parameter."""
        try:
            query = "DELETE FROM parameters WHERE id = $1"
            await execute(query, param_id)
        except Exception as e:
            logger.error(f"Error deleting parameter: {e}")
            raise

    async def delete_by_type(self, param_type: str) -> None:
        """Delete all parameters of a type."""
        try:
            query = "DELETE FROM parameters WHERE type = $1"
            await execute(query, param_type)
        except Exception as e:
            logger.error(f"Error deleting parameters by type: {e}")
            raise

    async def get_categories(self) -> list[str]:
        """Get all unique categories."""
        try:
            query = "SELECT DISTINCT category FROM parameters WHERE category IS NOT NULL ORDER BY category"
            records = await fetch(query)
            return [r["category"] for r in records]
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            raise

    def _parse_json_fields(self, data: dict[str, Any]) -> dict[str, Any]:
        """Parse JSON string fields."""
        for field in ["value", "metadata"]:
            if data.get(field) and isinstance(data[field], str):
                try:
                    data[field] = json.loads(data[field])
                except json.JSONDecodeError:
                    pass
        return data


# Singleton instance
parameter_repository = ParameterRepository()
