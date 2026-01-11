"""
User Models
Data models for user entities
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import EmailStr, Field

from app.models.base import BaseModel, TimestampMixin


class UserRole(str, Enum):
    """User role enumeration."""

    SUPER_ADMIN = "super_admin"
    COMPANY_ADMIN = "company_admin"
    TRAINER = "trainer"
    LEARNER = "learner"
    # Legacy roles for backwards compatibility
    ADMIN = "admin"
    USER = "user"
    ADVISOR = "advisor"


class UserData(TimestampMixin):
    """User data model (without password)."""

    id: str
    name: str
    email: EmailStr
    role: str = Field(default="learner")
    job_role: str | None = Field(default=None, alias="jobRole")

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }


class UserWithPassword(UserData):
    """User data model with password (for internal use)."""

    password: str


class UserWithStats(UserData):
    """User data model with statistics."""

    stats: dict[str, Any] | None = None


class UserStats(BaseModel):
    """User statistics."""

    total_simulations: int = Field(default=0, alias="totalSimulations")
    completed_simulations: int = Field(default=0, alias="completedSimulations")
    avg_score: float = Field(default=0.0, alias="avgScore")


class CreateUserRequest(BaseModel):
    """Request model for creating a user."""

    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = Field(default="learner")
    job_role: str | None = Field(default=None, alias="jobRole")


class UpdateUserRequest(BaseModel):
    """Request model for updating a user."""

    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    role: str | None = None
    job_role: str | None = Field(default=None, alias="jobRole")


class LoginRequest(BaseModel):
    """Request model for login."""

    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    """Request model for signup."""

    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str | None = Field(default="learner")
    job_role: str | None = Field(default=None, alias="jobRole")
    company: str | None = Field(default=None)

    model_config = {
        "populate_by_name": True,
    }


class AuthResult(BaseModel):
    """Authentication result."""

    user: UserData
    session_token: str = Field(alias="sessionToken")
    expires_at: datetime = Field(alias="expiresAt")

    model_config = {
        "populate_by_name": True,
    }


class BulkImportUser(BaseModel):
    """User data for bulk import."""

    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: EmailStr
    password: str
    role: str = Field(default="learner")
    job_role: str | None = Field(default=None, alias="jobRole")

    model_config = {
        "populate_by_name": True,
    }


class BulkImportResult(BaseModel):
    """Result of bulk import operation."""

    success: int
    failed: int
    errors: list[str]
