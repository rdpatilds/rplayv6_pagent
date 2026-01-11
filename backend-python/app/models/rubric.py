"""
Rubric Models
Data models for rubric entities
"""

from pydantic import Field

from app.models.base import BaseModel, TimestampMixin


class RubricEntry(BaseModel):
    """Rubric entry with score range."""

    range: str
    description: str
    criteria: list[str]


class RubricData(TimestampMixin):
    """Rubric data model."""

    id: str
    competency_id: str
    difficulty_level: int
    criteria: str
    weight: float = Field(default=10.0)
    description: str | None = None


class CreateRubricRequest(BaseModel):
    """Request model for creating a rubric."""

    competency_id: str
    difficulty_level: int
    criteria: str
    weight: float = Field(default=10.0)
    description: str | None = None


class UpdateRubricRequest(BaseModel):
    """Request model for updating a rubric."""

    criteria: str | None = None
    weight: float | None = None
    description: str | None = None


class FileRubric(BaseModel):
    """Rubric structure from JSON file."""

    id: str
    name: str
    description: str
    rubric: dict[str, list[RubricEntry]]  # beginner, intermediate, advanced


class RubricCriteria(BaseModel):
    """Rubric criteria for evaluation."""

    name: str
    weight: float
    description: str
    levels: list[RubricEntry]
