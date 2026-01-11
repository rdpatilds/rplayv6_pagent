"""
Middleware Module
FastAPI middleware components
"""

from app.middleware.auth import get_current_user, get_optional_user, require_admin
from app.middleware.error_handler import (
    AppException,
    http_exception_handler,
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)

__all__ = [
    "get_current_user",
    "get_optional_user",
    "require_admin",
    "AppException",
    "http_exception_handler",
    "app_exception_handler",
    "validation_exception_handler",
    "generic_exception_handler",
]
