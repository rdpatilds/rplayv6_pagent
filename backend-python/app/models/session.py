"""
Session Models
Data models for authentication sessions
"""

from datetime import datetime

from pydantic import Field

from app.models.base import BaseModel, TimestampMixin


class SessionData(BaseModel):
    """Session data model."""

    id: str
    user_id: str
    token: str
    expires_at: datetime
    user_email: str | None = None
    user_name: str | None = None
    user_role: str | None = None
    created_at: datetime | None = None


class SessionCreate(BaseModel):
    """Request model for creating a session."""

    user_id: str
    token: str
    expires_at: datetime
    user_email: str | None = None
    user_name: str | None = None
    user_role: str | None = None


class SessionInfo(BaseModel):
    """Session information for clients."""

    session_id: str = Field(alias="sessionId")
    user_id: str = Field(alias="userId")
    expires_at: datetime = Field(alias="expiresAt")
    is_valid: bool = Field(default=True, alias="isValid")

    model_config = {
        "populate_by_name": True,
    }
