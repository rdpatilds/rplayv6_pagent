"""
Competency Repository
Database operations for competency entities
"""

import json
import logging
from typing import Any
from uuid import uuid4

from app.database import fetch, fetchone, execute, record_to_dict, records_to_list
from app.models.competency import CompetencyData, CreateCompetencyRequest, UpdateCompetencyRequest

logger = logging.getLogger(__name__)


class CompetencyRepository:
    """Repository for competency database operations."""

    async def find_by_id(self, competency_id: str) -> CompetencyData | None:
        """Find competency by ID."""
        try:
            query = """
                SELECT id, name, description, category, industry, weight, difficulty_level, criteria, created_at, updated_at
                FROM competencies WHERE id = $1
            """
            record = await fetchone(query, competency_id)
            if not record:
                return None
            data = record_to_dict(record)
            if data.get("criteria") and isinstance(data["criteria"], str):
                try:
                    data["criteria"] = json.loads(data["criteria"])
                except json.JSONDecodeError:
                    pass
            return CompetencyData(**data)
        except Exception as e:
            logger.error(f"Error finding competency by ID: {e}")
            raise

    async def find_all(self) -> list[CompetencyData]:
        """Get all competencies."""
        try:
            query = """
                SELECT id, name, description, category, industry, weight, difficulty_level, criteria, created_at, updated_at
                FROM competencies ORDER BY name
            """
            records = await fetch(query)
            competencies = []
            for record in records:
                data = dict(record)
                if data.get("criteria") and isinstance(data["criteria"], str):
                    try:
                        data["criteria"] = json.loads(data["criteria"])
                    except json.JSONDecodeError:
                        pass
                competencies.append(CompetencyData(**data))
            return competencies
        except Exception as e:
            logger.error(f"Error fetching all competencies: {e}")
            raise

    async def find_by_industry(self, industry: str) -> list[CompetencyData]:
        """Find competencies by industry."""
        try:
            query = """
                SELECT id, name, description, category, industry, weight, difficulty_level, criteria, created_at, updated_at
                FROM competencies WHERE industry = $1 OR industry IS NULL
                ORDER BY name
            """
            records = await fetch(query, industry)
            competencies = []
            for record in records:
                data = dict(record)
                if data.get("criteria") and isinstance(data["criteria"], str):
                    try:
                        data["criteria"] = json.loads(data["criteria"])
                    except json.JSONDecodeError:
                        pass
                competencies.append(CompetencyData(**data))
            return competencies
        except Exception as e:
            logger.error(f"Error finding competencies by industry: {e}")
            raise

    async def find_by_category(self, category: str) -> list[CompetencyData]:
        """Find competencies by category."""
        try:
            query = """
                SELECT id, name, description, category, industry, weight, difficulty_level, criteria, created_at, updated_at
                FROM competencies WHERE category = $1
                ORDER BY name
            """
            records = await fetch(query, category)
            competencies = []
            for record in records:
                data = dict(record)
                if data.get("criteria") and isinstance(data["criteria"], str):
                    try:
                        data["criteria"] = json.loads(data["criteria"])
                    except json.JSONDecodeError:
                        pass
                competencies.append(CompetencyData(**data))
            return competencies
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

            competency_id = str(uuid4())
            query = """
                INSERT INTO competencies (id, name, description, category, industry, weight, difficulty_level, criteria)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, name, description, category, industry, weight, difficulty_level, criteria, created_at, updated_at
            """
            criteria = data.get("criteria")
            if criteria and not isinstance(criteria, str):
                criteria = json.dumps(criteria)

            record = await fetchone(
                query,
                competency_id,
                data["name"],
                data.get("description"),
                data.get("category"),
                data.get("industry"),
                data.get("weight", 1.0),
                data.get("difficulty_level"),
                criteria,
            )
            result_data = record_to_dict(record)
            if result_data.get("criteria") and isinstance(result_data["criteria"], str):
                try:
                    result_data["criteria"] = json.loads(result_data["criteria"])
                except json.JSONDecodeError:
                    pass
            return CompetencyData(**result_data)
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

            # Build dynamic update query
            update_parts = []
            params = [competency_id]
            param_idx = 2

            for key, value in data.items():
                if key == "criteria" and value and not isinstance(value, str):
                    value = json.dumps(value)
                update_parts.append(f"{key} = ${param_idx}")
                params.append(value)
                param_idx += 1

            if not update_parts:
                return await self.find_by_id(competency_id)

            update_parts.append("updated_at = NOW()")
            query = f"""
                UPDATE competencies SET {', '.join(update_parts)}
                WHERE id = $1
                RETURNING id, name, description, category, industry, weight, difficulty_level, criteria, created_at, updated_at
            """
            record = await fetchone(query, *params)
            if not record:
                raise ValueError("Competency not found")
            result_data = record_to_dict(record)
            if result_data.get("criteria") and isinstance(result_data["criteria"], str):
                try:
                    result_data["criteria"] = json.loads(result_data["criteria"])
                except json.JSONDecodeError:
                    pass
            return CompetencyData(**result_data)
        except Exception as e:
            logger.error(f"Error updating competency: {e}")
            raise

    async def delete(self, competency_id: str) -> None:
        """Delete a competency."""
        try:
            query = "DELETE FROM competencies WHERE id = $1"
            await execute(query, competency_id)
        except Exception as e:
            logger.error(f"Error deleting competency: {e}")
            raise


# Singleton instance
competency_repository = CompetencyRepository()
