"""
Validation Utilities
Common validation functions
"""

import re
from uuid import UUID


def validate_email(email: str) -> bool:
    """
    Validate email format.

    Args:
        email: Email address to validate

    Returns:
        True if valid email format
    """
    if not email:
        return False
    email_regex = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    return bool(re.match(email_regex, email))


def validate_uuid(value: str) -> bool:
    """
    Validate UUID format.

    Args:
        value: String to validate

    Returns:
        True if valid UUID format
    """
    if not value:
        return False
    try:
        UUID(value)
        return True
    except ValueError:
        return False


def validate_password(password: str, min_length: int = 8, require_complexity: bool = True) -> dict[str, any]:
    """
    Validate password strength.

    Args:
        password: Password to validate
        min_length: Minimum password length
        require_complexity: Whether to require uppercase, lowercase, and numbers

    Returns:
        Dict with 'valid' boolean and optional 'message' string
    """
    if not password:
        return {"valid": False, "message": "Password is required"}

    if len(password) < min_length:
        return {"valid": False, "message": f"Password must be at least {min_length} characters long"}

    if require_complexity:
        if not re.search(r"[A-Z]", password):
            return {"valid": False, "message": "Password must contain at least one uppercase letter"}

        if not re.search(r"[a-z]", password):
            return {"valid": False, "message": "Password must contain at least one lowercase letter"}

        if not re.search(r"[0-9]", password):
            return {"valid": False, "message": "Password must contain at least one number"}

    return {"valid": True}


def sanitize_string(value: str | None, max_length: int = 255) -> str | None:
    """
    Sanitize string input.

    Args:
        value: String to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized string or None
    """
    if value is None:
        return None
    # Strip whitespace and limit length
    sanitized = value.strip()[:max_length]
    return sanitized if sanitized else None
