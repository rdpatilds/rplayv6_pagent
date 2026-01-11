"""
Parameter Models
Data models for parameter catalog entities
"""

from enum import Enum
from typing import Any

from pydantic import Field

from app.models.base import BaseModel, TimestampMixin


class ParameterType(str, Enum):
    """Parameter type enumeration."""

    STRUCTURED = "structured"
    NARRATIVE = "narrative"
    GUARDRAIL = "guardrail"


class ParameterData(TimestampMixin):
    """Parameter data model."""

    id: str
    name: str
    type: str
    value: Any
    description: str | None = None
    category: str | None = None
    is_active: bool = Field(default=True, alias="isActive")
    metadata: dict[str, Any] | None = None

    model_config = {
        "populate_by_name": True,
    }


class CreateParameterRequest(BaseModel):
    """Request model for creating a parameter."""

    name: str = Field(..., min_length=1)
    type: str
    value: Any
    description: str | None = None
    category: str | None = None
    is_active: bool = Field(default=True, alias="isActive")
    metadata: dict[str, Any] | None = None

    model_config = {
        "populate_by_name": True,
    }


class UpdateParameterRequest(BaseModel):
    """Request model for updating a parameter."""

    name: str | None = None
    type: str | None = None
    value: Any | None = None
    description: str | None = None
    category: str | None = None
    is_active: bool | None = Field(default=None, alias="isActive")
    metadata: dict[str, Any] | None = None

    model_config = {
        "populate_by_name": True,
    }


class ParameterCatalog(BaseModel):
    """Parameter catalog containing all parameter types."""

    structured: list[ParameterData] = Field(default_factory=list)
    narrative: list[ParameterData] = Field(default_factory=list)
    guardrail: list[ParameterData] = Field(default_factory=list)


class CategoryInfo(BaseModel):
    """Category information for parameters."""

    name: str
    description: str | None = None
    parameter_count: int = Field(default=0, alias="parameterCount")

    model_config = {
        "populate_by_name": True,
    }
