"""
Chat Models
Data models for AI chat interactions
"""

from typing import Any, Literal

from pydantic import Field

from app.models.base import BaseModel


class ChatMessage(BaseModel):
    """Chat message model."""

    role: Literal["system", "user", "assistant"]
    content: str


class ObjectiveProgress(BaseModel):
    """Objective progress tracking."""

    rapport: float = Field(default=0, ge=0, le=100)
    needs: float = Field(default=0, ge=0, le=100)
    objections: float = Field(default=0, ge=0, le=100)
    recommendations: float = Field(default=0, ge=0, le=100)
    explanation: str | None = None


class AIResponse(BaseModel):
    """AI response model."""

    message: str
    token_usage: dict[str, int] | None = Field(default=None, alias="tokenUsage")
    source: Literal["azure", "openai"] | None = None
    objective_progress: ObjectiveProgress | None = Field(default=None, alias="objectiveProgress")

    model_config = {
        "populate_by_name": True,
    }


class ClientResponseRequest(BaseModel):
    """Request for generating client response."""

    messages: list[ChatMessage]
    client_profile: dict[str, Any] = Field(alias="clientProfile")
    personality_settings: dict[str, Any] | None = Field(default=None, alias="personalitySettings")
    simulation_settings: dict[str, Any] = Field(alias="simulationSettings")
    api_key: str | None = Field(default=None, alias="apiKey")

    model_config = {
        "populate_by_name": True,
    }


class ExpertResponseRequest(BaseModel):
    """Request for generating expert guidance."""

    messages: list[ChatMessage]
    client_profile: dict[str, Any] = Field(alias="clientProfile")
    personality_settings: dict[str, Any] | None = Field(default=None, alias="personalitySettings")
    simulation_settings: dict[str, Any] = Field(alias="simulationSettings")
    objectives: list[dict[str, Any]] | None = None
    api_key: str | None = Field(default=None, alias="apiKey")

    model_config = {
        "populate_by_name": True,
    }


class GenerateReviewRequest(BaseModel):
    """Request for generating performance review."""

    messages: list[ChatMessage]
    competencies: list[dict[str, Any]] | None = None
    difficulty_level: str | None = Field(default=None, alias="difficultyLevel")

    model_config = {
        "populate_by_name": True,
    }


class EvaluationResult(BaseModel):
    """AI evaluation result."""

    overall_score: float = Field(alias="overallScore")
    competency_scores: dict[str, float] = Field(alias="competencyScores")
    feedback: str
    strengths: list[str]
    improvements: list[str]
    source: Literal["azure", "openai"] | None = None

    model_config = {
        "populate_by_name": True,
    }


class PerformanceReview(BaseModel):
    """Performance review data."""

    overall_score: float = Field(alias="overallScore")
    competency_scores: list[dict[str, Any]] = Field(alias="competencyScores")
    general_strengths: list[str] = Field(alias="generalStrengths")
    general_improvements: list[str] = Field(alias="generalImprovements")
    summary: str

    model_config = {
        "populate_by_name": True,
    }
