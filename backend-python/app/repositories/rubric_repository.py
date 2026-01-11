"""
Rubric Repository
Database operations for rubric entities
"""

import logging
from typing import Any
from uuid import uuid4

from app.database import fetch, fetchone, execute, record_to_dict, records_to_list
from app.models.rubric import RubricData, CreateRubricRequest, UpdateRubricRequest

logger = logging.getLogger(__name__)


class RubricRepository:
    """Repository for rubric database operations."""

    async def find_by_id(self, rubric_id: str) -> RubricData | None:
        """Find rubric by ID."""
        try:
            query = """
                SELECT id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
                FROM rubrics WHERE id = $1
            """
            record = await fetchone(query, rubric_id)
            if not record:
                return None
            return RubricData(**record_to_dict(record))
        except Exception as e:
            logger.error(f"Error finding rubric by ID: {e}")
            raise

    async def find_all(self) -> list[RubricData]:
        """Get all rubrics."""
        try:
            query = """
                SELECT id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
                FROM rubrics ORDER BY competency_id, difficulty_level
            """
            records = await fetch(query)
            return [RubricData(**r) for r in records_to_list(records)]
        except Exception as e:
            logger.error(f"Error fetching all rubrics: {e}")
            raise

    async def find_by_competency_id(self, competency_id: str) -> list[RubricData]:
        """Find rubrics by competency ID."""
        try:
            query = """
                SELECT id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
                FROM rubrics WHERE competency_id = $1
                ORDER BY difficulty_level
            """
            records = await fetch(query, competency_id)
            return [RubricData(**r) for r in records_to_list(records)]
        except Exception as e:
            logger.error(f"Error finding rubrics by competency ID: {e}")
            raise

    async def find_by_difficulty_level(self, difficulty_level: int) -> list[RubricData]:
        """Find rubrics by difficulty level."""
        try:
            query = """
                SELECT id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
                FROM rubrics WHERE difficulty_level = $1
                ORDER BY competency_id
            """
            records = await fetch(query, difficulty_level)
            return [RubricData(**r) for r in records_to_list(records)]
        except Exception as e:
            logger.error(f"Error finding rubrics by difficulty level: {e}")
            raise

    async def find_by_competency_and_difficulty(
        self,
        competency_id: str,
        difficulty_level: int,
    ) -> list[RubricData]:
        """Find rubrics by competency and difficulty."""
        try:
            query = """
                SELECT id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
                FROM rubrics WHERE competency_id = $1 AND difficulty_level = $2
            """
            records = await fetch(query, competency_id, difficulty_level)
            return [RubricData(**r) for r in records_to_list(records)]
        except Exception as e:
            logger.error(f"Error finding rubrics by competency and difficulty: {e}")
            raise

    async def create(self, rubric_data: CreateRubricRequest | dict[str, Any]) -> RubricData:
        """Create a new rubric."""
        try:
            if isinstance(rubric_data, CreateRubricRequest):
                data = rubric_data.model_dump()
            else:
                data = rubric_data

            rubric_id = str(uuid4())
            query = """
                INSERT INTO rubrics (id, competency_id, difficulty_level, criteria, weight, description)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
            """
            record = await fetchone(
                query,
                rubric_id,
                data["competency_id"],
                data["difficulty_level"],
                data["criteria"],
                data.get("weight", 10.0),
                data.get("description"),
            )
            return RubricData(**record_to_dict(record))
        except Exception as e:
            logger.error(f"Error creating rubric: {e}")
            raise

    async def update(self, rubric_id: str, rubric_data: UpdateRubricRequest | dict[str, Any]) -> RubricData:
        """Update a rubric."""
        try:
            if isinstance(rubric_data, UpdateRubricRequest):
                data = rubric_data.model_dump(exclude_unset=True)
            else:
                data = {k: v for k, v in rubric_data.items() if v is not None}

            # Build dynamic update query
            update_parts = []
            params = [rubric_id]
            param_idx = 2

            for key, value in data.items():
                update_parts.append(f"{key} = ${param_idx}")
                params.append(value)
                param_idx += 1

            if not update_parts:
                return await self.find_by_id(rubric_id)

            update_parts.append("updated_at = NOW()")
            query = f"""
                UPDATE rubrics SET {', '.join(update_parts)}
                WHERE id = $1
                RETURNING id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
            """
            record = await fetchone(query, *params)
            if not record:
                raise ValueError("Rubric not found")
            return RubricData(**record_to_dict(record))
        except Exception as e:
            logger.error(f"Error updating rubric: {e}")
            raise

    async def delete(self, rubric_id: str) -> None:
        """Delete a rubric."""
        try:
            query = "DELETE FROM rubrics WHERE id = $1"
            await execute(query, rubric_id)
        except Exception as e:
            logger.error(f"Error deleting rubric: {e}")
            raise

    async def delete_by_competency_id(self, competency_id: str) -> None:
        """Delete all rubrics for a competency."""
        try:
            query = "DELETE FROM rubrics WHERE competency_id = $1"
            await execute(query, competency_id)
        except Exception as e:
            logger.error(f"Error deleting rubrics by competency ID: {e}")
            raise

    async def bulk_create(self, rubrics: list[CreateRubricRequest | dict[str, Any]]) -> list[RubricData]:
        """Bulk create rubrics."""
        created_rubrics = []
        for rubric_data in rubrics:
            try:
                rubric = await self.create(rubric_data)
                created_rubrics.append(rubric)
            except Exception as e:
                logger.error(f"Error creating rubric in bulk: {e}")
        return created_rubrics


# Singleton instance
rubric_repository = RubricRepository()
