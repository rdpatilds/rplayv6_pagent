"""
Auth Middleware
FastAPI dependencies for authentication and authorization
"""

import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status, Header

from app.services.auth_service import auth_service
from app.models.user import UserData

logger = logging.getLogger(__name__)


async def get_token_from_header(
    authorization: Annotated[str | None, Header()] = None,
) -> str | None:
    """Extract token from Authorization header."""
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return None


async def get_current_user(
    token: Annotated[str | None, Depends(get_token_from_header)],
) -> UserData:
    """
    Get current authenticated user.
    Raises 401 if not authenticated.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await auth_service.verify_session(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_optional_user(
    token: Annotated[str | None, Depends(get_token_from_header)],
) -> UserData | None:
    """
    Get current user if authenticated.
    Returns None if not authenticated.
    """
    if not token:
        return None

    try:
        return await auth_service.verify_session(token)
    except Exception:
        return None


async def require_admin(
    user: Annotated[UserData, Depends(get_current_user)],
) -> UserData:
    """
    Require admin role.
    Raises 403 if user is not admin.
    """
    if user.role not in ("super_admin", "company_admin", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def require_trainer_or_admin(
    user: Annotated[UserData, Depends(get_current_user)],
) -> UserData:
    """
    Require trainer or admin role.
    Raises 403 if user doesn't have required role.
    """
    if user.role not in ("super_admin", "company_admin", "admin", "trainer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainer or admin access required",
        )
    return user


def verify_resource_ownership(user: UserData, resource_user_id: str) -> bool:
    """
    Verify if user owns the resource or is admin.
    """
    # Admins can access all resources
    if user.role in ("super_admin", "company_admin", "admin"):
        return True
    # Users can only access their own resources
    return user.id == resource_user_id


def require_ownership_or_admin(user: UserData, resource_user_id: str) -> None:
    """
    Require ownership or admin role.
    Raises 403 if user doesn't own resource and is not admin.
    """
    if not verify_resource_ownership(user, resource_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource",
        )
