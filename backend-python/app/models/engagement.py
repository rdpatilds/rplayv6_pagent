"""
Engagement Models
Data models for engagement tracking entities
"""

from enum import Enum
from typing import Any

from pydantic import Field

from app.models.base import BaseModel, TimestampMixin


class EngagementEventType(str, Enum):
    """Engagement event types."""

    SIMULATION_START = "simulation_start"
    SIMULATION_COMPLETE = "simulation_complete"
    MESSAGE_SENT = "message_sent"
    MESSAGE_RECEIVED = "message_received"
    OBJECTIVE_COMPLETED = "objective_completed"
    HELP_REQUESTED = "help_requested"
    SESSION_START = "session_start"
    SESSION_END = "session_end"


class EngagementData(TimestampMixin):
    """Engagement event data model."""

    id: str
    user_id: str
    simulation_id: str | None = None
    event_type: str
    event_data: dict[str, Any] | None = None
    timestamp: str | None = None


class CreateEngagementRequest(BaseModel):
    """Request model for creating an engagement event."""

    user_id: str
    simulation_id: str | None = None
    event_type: str
    event_data: dict[str, Any] | None = None


class EngagementMetrics(BaseModel):
    """Engagement metrics summary."""

    total_events: int = Field(alias="totalEvents")
    simulations_started: int = Field(alias="simulationsStarted")
    simulations_completed: int = Field(alias="simulationsCompleted")
    messages_sent: int = Field(alias="messagesSent")
    avg_session_duration: float = Field(alias="avgSessionDuration")
    completion_rate: float = Field(alias="completionRate")

    model_config = {
        "populate_by_name": True,
    }


class UserEngagement(BaseModel):
    """User engagement summary."""

    user_id: str = Field(alias="userId")
    total_simulations: int = Field(alias="totalSimulations")
    completed_simulations: int = Field(alias="completedSimulations")
    total_messages: int = Field(alias="totalMessages")
    last_activity: str | None = Field(default=None, alias="lastActivity")

    model_config = {
        "populate_by_name": True,
    }
