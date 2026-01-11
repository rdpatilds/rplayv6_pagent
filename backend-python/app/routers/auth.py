"""
Auth Router
Authentication endpoints
"""

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, status, Depends

from app.services.auth_service import auth_service
from app.models.user import LoginRequest, SignupRequest, UserData
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: SignupRequest):
    """Register a new user."""
    try:
        logger.info(f"[REGISTRATION] Attempt for email: {request.email}")

        result = await auth_service.signup(request)

        logger.info(f"[REGISTRATION] Success for user: {result.user.id}, {request.email}")

        return {
            "success": True,
            "data": {
                "user": result.user.model_dump(),
                "token": result.session_token,
            },
            "message": "User registered successfully",
        }
    except ValueError as e:
        message = str(e)
        logger.error(f"[REGISTRATION] Failed for email: {request.email} - Error: {message}")

        if "already registered" in message or "already exists" in message or "duplicate" in message.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already registered. Please use a different email or try logging in.",
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    except Exception as e:
        logger.error(f"[REGISTRATION] Failed for email: {request.email} - Error: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login")
async def login(request: LoginRequest):
    """Login user."""
    try:
        result = await auth_service.login(request)

        return {
            "success": True,
            "data": {
                "user": result.user.model_dump(),
                "token": result.session_token,
            },
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )


@router.post("/change-password")
async def change_password(
    user_id: str,
    current_password: str,
    new_password: str,
):
    """Change user password."""
    try:
        await auth_service.change_password(user_id, current_password, new_password)

        return {
            "success": True,
            "message": "Password changed successfully",
        }
    except ValueError as e:
        message = str(e)
        if "not found" in message:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
        if "incorrect" in message or "invalid" in message:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me")
async def get_current_user_info(
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Get current user info."""
    return {
        "success": True,
        "data": user.model_dump(),
    }


@router.post("/logout")
async def logout(token: str):
    """Logout user."""
    try:
        await auth_service.logout(token)
        return {"success": True, "message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"success": True, "message": "Logged out"}
