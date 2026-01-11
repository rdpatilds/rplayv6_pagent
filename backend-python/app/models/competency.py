"""
Competency Models
Data models for competency entities
"""

from typing import Any

from pydantic import Field

from app.models.base import BaseModel, TimestampMixin


class CompetencyData(TimestampMixin):
    """Competency data model."""

    id: str
    name: str
    description: str | None = None
    category: str | None = None
    industry: str | None = None
    weight: float = Field(default=1.0)
    difficulty_level: int | None = Field(default=None, alias="difficultyLevel")
    criteria: list[str] | None = None

    model_config = {
        "populate_by_name": True,
    }


class CreateCompetencyRequest(BaseModel):
    """Request model for creating a competency."""

    name: str = Field(..., min_length=1)
    description: str | None = None
    category: str | None = None
    industry: str | None = None
    weight: float = Field(default=1.0)
    difficulty_level: int | None = Field(default=None, alias="difficultyLevel")
    criteria: list[str] | None = None

    model_config = {
        "populate_by_name": True,
    }


class UpdateCompetencyRequest(BaseModel):
    """Request model for updating a competency."""

    name: str | None = None
    description: str | None = None
    category: str | None = None
    industry: str | None = None
    weight: float | None = None
    difficulty_level: int | None = Field(default=None, alias="difficultyLevel")
    criteria: list[str] | None = None

    model_config = {
        "populate_by_name": True,
    }


class CompetencyScore(BaseModel):
    """Competency score in evaluation."""

    name: str
    score: float
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    expectation: str | None = None


class IndustryCompetencies(BaseModel):
    """Industry competencies mapping."""

    industry: str
    subcategory: str | None = None
    competencies: list[str]
    focus_areas: dict[str, Any] | None = Field(default=None, alias="focusAreas")

    model_config = {
        "populate_by_name": True,
    }
