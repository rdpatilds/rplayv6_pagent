"""
File-Based Rubric Repository
Reads/writes rubrics from JSON files instead of database
Adapts file format to match database repository interface
"""

import logging
from typing import Any
from uuid import uuid4

from app.utils.file_storage import read_json_file, write_json_file
from app.models.rubric import RubricData, CreateRubricRequest, UpdateRubricRequest

logger = logging.getLogger(__name__)

RUBRICS_FILE = "rubrics.json"


class FileRubricRepository:
    """File-based repository for rubric operations."""

    def _file_to_db_format(self, file_rubric: dict[str, Any]) -> list[RubricData]:
        """Convert file format to database format."""
        db_rubrics: list[RubricData] = []
        rubric_data = file_rubric.get("rubric", {})

        # Convert beginner rubrics (levels 1-2)
        for index, entry in enumerate(rubric_data.get("beginner", [])):
            criteria = entry.get("criteria", [])
            db_rubrics.append(
                RubricData(
                    id=f"{file_rubric['id']}-beginner-{index}",
                    competency_id=file_rubric["id"],
                    difficulty_level=1,
                    criteria="; ".join(criteria) if isinstance(criteria, list) else str(criteria),
                    weight=10,
                    description=entry.get("description"),
                )
            )

        # Convert intermediate rubrics (levels 3-4)
        for index, entry in enumerate(rubric_data.get("intermediate", [])):
            criteria = entry.get("criteria", [])
            db_rubrics.append(
                RubricData(
                    id=f"{file_rubric['id']}-intermediate-{index}",
                    competency_id=file_rubric["id"],
                    difficulty_level=3,
                    criteria="; ".join(criteria) if isinstance(criteria, list) else str(criteria),
                    weight=10,
                    description=entry.get("description"),
                )
            )

        # Convert advanced rubrics (level 5)
        for index, entry in enumerate(rubric_data.get("advanced", [])):
            criteria = entry.get("criteria", [])
            db_rubrics.append(
                RubricData(
                    id=f"{file_rubric['id']}-advanced-{index}",
                    competency_id=file_rubric["id"],
                    difficulty_level=5,
                    criteria="; ".join(criteria) if isinstance(criteria, list) else str(criteria),
                    weight=10,
                    description=entry.get("description"),
                )
            )

        return db_rubrics

    async def find_by_id(self, rubric_id: str) -> RubricData | None:
        """Find rubric by ID."""
        try:
            all_rubrics = await self.find_all()
            for rubric in all_rubrics:
                if rubric.id == rubric_id:
                    return rubric
            return None
        except Exception as e:
            logger.error(f"Error finding rubric by ID: {e}")
            raise

    async def find_all(self) -> list[RubricData]:
        """Get all rubrics."""
        try:
            file_rubrics = read_json_file(RUBRICS_FILE) or []
            all_rubrics: list[RubricData] = []

            for file_rubric in file_rubrics:
                all_rubrics.extend(self._file_to_db_format(file_rubric))

            return all_rubrics
        except Exception as e:
            logger.error(f"Error fetching all rubrics: {e}")
            raise

    async def find_by_competency_id(self, competency_id: str) -> list[RubricData]:
        """Get rubrics by competency ID."""
        try:
            file_rubrics = read_json_file(RUBRICS_FILE) or []
            for file_rubric in file_rubrics:
                if file_rubric.get("id") == competency_id:
                    return self._file_to_db_format(file_rubric)
            return []
        except Exception as e:
            logger.error(f"Error fetching rubrics by competency: {e}")
            raise

    async def find_by_difficulty_level(self, difficulty_level: int) -> list[RubricData]:
        """Get rubrics by difficulty level."""
        try:
            all_rubrics = await self.find_all()
            return [r for r in all_rubrics if r.difficulty_level == difficulty_level]
        except Exception as e:
            logger.error(f"Error fetching rubrics by difficulty level: {e}")
            raise

    async def find_by_competency_and_difficulty(
        self,
        competency_id: str,
        difficulty_level: int,
    ) -> list[RubricData]:
        """Get rubrics by competency and difficulty."""
        try:
            competency_rubrics = await self.find_by_competency_id(competency_id)
            return [r for r in competency_rubrics if r.difficulty_level == difficulty_level]
        except Exception as e:
            logger.error(f"Error fetching rubrics by competency and difficulty: {e}")
            raise

    async def create(self, rubric_data: CreateRubricRequest | dict[str, Any]) -> RubricData:
        """Create rubric (simplified - returns a stub)."""
        try:
            if isinstance(rubric_data, CreateRubricRequest):
                data = rubric_data.model_dump()
            else:
                data = rubric_data

            # File-based system doesn't support individual rubric creation
            # Return a stub for compatibility
            return RubricData(
                id=str(uuid4()),
                **data,
            )
        except Exception as e:
            logger.error(f"Error creating rubric: {e}")
            raise

    async def update(self, rubric_id: str, rubric_data: UpdateRubricRequest | dict[str, Any]) -> RubricData:
        """Update rubric (simplified - returns updated data)."""
        try:
            existing = await self.find_by_id(rubric_id)
            if not existing:
                raise ValueError("Rubric not found")

            if isinstance(rubric_data, UpdateRubricRequest):
                data = rubric_data.model_dump(exclude_unset=True)
            else:
                data = {k: v for k, v in rubric_data.items() if v is not None}

            # Merge existing with updates
            updated_data = existing.model_dump()
            updated_data.update(data)
            return RubricData(**updated_data)
        except Exception as e:
            logger.error(f"Error updating rubric: {e}")
            raise

    async def delete(self, rubric_id: str) -> None:
        """Delete rubric (simplified - no-op)."""
        try:
            # File-based system doesn't support individual rubric deletion
            logger.info(f"Delete rubric {rubric_id} - no-op in file-based system")
        except Exception as e:
            logger.error(f"Error deleting rubric: {e}")
            raise

    async def delete_by_competency_id(self, competency_id: str) -> None:
        """Delete rubrics by competency (simplified - no-op)."""
        try:
            logger.info(f"Delete rubrics for competency {competency_id} - no-op in file-based system")
        except Exception as e:
            logger.error(f"Error deleting rubrics by competency: {e}")
            raise

    async def bulk_create(self, rubrics: list[CreateRubricRequest | dict[str, Any]]) -> list[RubricData]:
        """Bulk create rubrics (simplified - returns stubs)."""
        try:
            return [
                RubricData(
                    id=str(uuid4()),
                    **(r.model_dump() if isinstance(r, CreateRubricRequest) else r),
                )
                for r in rubrics
            ]
        except Exception as e:
            logger.error(f"Error bulk creating rubrics: {e}")
            raise


# Singleton instance
file_rubric_repository = FileRubricRepository()
