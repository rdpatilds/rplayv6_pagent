"""
Feedback Models
Data models for feedback and NPS entities
"""

from typing import Any

from pydantic import Field

from app.models.base import BaseModel, TimestampMixin


class FeedbackData(TimestampMixin):
    """Feedback data model."""

    id: str
    simulation_id: str
    user_id: str
    competency_id: str | None = None
    rating: int | None = None
    comments: str | None = None
    feedback_type: str = Field(default="general")
    metadata: dict[str, Any] | None = None


class CreateFeedbackRequest(BaseModel):
    """Request model for creating feedback."""

    simulation_id: str
    user_id: str
    competency_id: str | None = None
    rating: int | None = None
    comments: str | None = None
    feedback_type: str = Field(default="general")
    metadata: dict[str, Any] | None = None


class UpdateFeedbackRequest(BaseModel):
    """Request model for updating feedback."""

    rating: int | None = None
    comments: str | None = None
    feedback_type: str | None = None
    metadata: dict[str, Any] | None = None


class NPSData(TimestampMixin):
    """NPS feedback data model."""

    id: str
    user_id: str
    simulation_id: str | None = None
    score: int = Field(..., ge=0, le=10)
    feedback_text: str | None = None
    categories: list[str] | None = None
    follow_up_consent: bool = Field(default=False, alias="followUpConsent")
    submit_time_ms: int | None = Field(default=None, alias="submitTimeMs")

    model_config = {
        "populate_by_name": True,
    }


class CreateNPSRequest(BaseModel):
    """Request model for creating NPS feedback."""

    user_id: str
    simulation_id: str | None = None
    score: int = Field(..., ge=0, le=10)
    feedback_text: str | None = None
    categories: list[str] | None = None
    follow_up_consent: bool = Field(default=False, alias="followUpConsent")
    submit_time_ms: int | None = Field(default=None, alias="submitTimeMs")

    model_config = {
        "populate_by_name": True,
    }


class NPSAnalytics(BaseModel):
    """NPS analytics data."""

    total_responses: int = Field(alias="totalResponses")
    promoters: int
    passives: int
    detractors: int
    nps_score: float = Field(alias="npsScore")
    avg_score: float = Field(alias="avgScore")

    model_config = {
        "populate_by_name": True,
    }


class FeedbackSummary(BaseModel):
    """Feedback summary for a simulation."""

    simulation_id: str = Field(alias="simulationId")
    overall_rating: float = Field(alias="overallRating")
    competency_ratings: dict[str, float] = Field(alias="competencyRatings")
    comments: list[str]

    model_config = {
        "populate_by_name": True,
    }
