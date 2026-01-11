"""
Simulation Models
Data models for simulation entities
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import Field

from app.models.base import BaseModel, TimestampMixin


class Industry(str, Enum):
    """Supported industries."""

    WEALTH_MANAGEMENT = "wealth-management"
    BANKING = "banking"
    INSURANCE = "insurance"
    FINANCIAL_PLANNING = "financial-planning"


class DifficultyLevel(str, Enum):
    """Simulation difficulty levels."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class SimulationStatus(str, Enum):
    """Simulation status values."""

    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class ClientProfile(BaseModel):
    """Client profile for simulations."""

    name: str
    age: int | None = None
    occupation: str | None = None
    income: str | None = None
    family: str | None = None
    goals: list[str] | None = None
    personality: dict[str, Any] | None = None
    background: str | None = None
    concerns: list[str] | None = None


class PersonalitySettings(BaseModel):
    """Client personality settings."""

    mood: str = Field(default="neutral")
    archetype: str = Field(default="Standard Client")
    traits: dict[str, int] = Field(default_factory=dict)
    influence: str = Field(default="balanced")


class SimulationSettings(BaseModel):
    """Simulation configuration settings."""

    industry: str
    subcategory: str | None = None
    difficulty: str = Field(default="beginner")
    competencies: list[str] | None = None
    simulation_id: str | None = Field(default=None, alias="simulationId")

    model_config = {
        "populate_by_name": True,
    }


class SimulationData(BaseModel):
    """Simulation data model."""

    id: str
    simulation_id: str | None = None  # Text identifier like SIM-12345
    user_id: str
    industry: str
    subcategory: str | None = None
    difficulty: str = Field(default="beginner")
    client_profile: dict[str, Any] | None = None
    conversation_history: list[dict[str, Any]] | None = None
    objectives_completed: list[str] | None = None
    total_xp: int | None = Field(default=0)
    performance_review: dict[str, Any] | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_seconds: int | None = None


class SimulationWithDetails(SimulationData):
    """Simulation with related data."""

    competencies: list[dict[str, Any]] | None = None
    rubrics: list[dict[str, Any]] | None = None
    feedback: list[dict[str, Any]] | None = None


class SimulationScore(BaseModel):
    """Simulation score breakdown."""

    overall: float
    by_competency: dict[str, float] = Field(alias="byCompetency")
    breakdown: list[dict[str, Any]]

    model_config = {
        "populate_by_name": True,
    }


class StartSimulationRequest(BaseModel):
    """Request model for starting a simulation."""

    user_id: str | None = Field(default=None, alias="userId")
    simulation_id: str | None = Field(default=None, alias="simulationId")
    industry: str
    subcategory: str | None = None
    difficulty_level: str | int = Field(default="beginner", alias="difficulty_level")
    client_profile: dict[str, Any] | None = Field(default=None, alias="clientProfile")
    objectives: list[str] | None = None

    model_config = {
        "populate_by_name": True,
    }


class UpdateSimulationRequest(BaseModel):
    """Request model for updating a simulation."""

    conversation_history: list[dict[str, Any]] | None = None
    objectives_completed: list[str] | None = None
    total_xp: int | None = None


class CompleteSimulationRequest(BaseModel):
    """Request model for completing a simulation."""

    total_xp: int = Field(default=0)
    performance_review: dict[str, Any] | None = None
    duration_seconds: int | None = None


class SimulationAnalytics(BaseModel):
    """Simulation analytics data."""

    duration: int
    message_count: int = Field(alias="messageCount")
    competency_scores: dict[str, float] = Field(alias="competencyScores")
    engagement_metrics: dict[str, Any] = Field(alias="engagementMetrics")

    model_config = {
        "populate_by_name": True,
    }
