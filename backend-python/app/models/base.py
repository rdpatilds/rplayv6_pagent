"""
Base Models
Common base classes for all models
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel as PydanticBaseModel
from pydantic import ConfigDict


class BaseModel(PydanticBaseModel):
    """Base model with common configuration."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        use_enum_values=True,
        arbitrary_types_allowed=True,
    )


class TimestampMixin(BaseModel):
    """Mixin for models with timestamps."""

    created_at: datetime | None = None
    updated_at: datetime | None = None


class APIResponse(BaseModel):
    """Standard API response wrapper."""

    success: bool
    data: Any | None = None
    error: str | None = None
    message: str | None = None


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""

    success: bool
    data: list[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class ErrorDetail(BaseModel):
    """Error detail for API responses."""

    code: str
    message: str
    details: dict[str, Any] | None = None
