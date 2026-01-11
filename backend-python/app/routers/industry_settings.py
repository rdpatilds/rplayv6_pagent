"""
Industry Settings Router
Industry configuration endpoints
"""

import logging
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, status, Depends, Body

from app.services.industry_service import industry_service
from app.middleware.auth import get_current_user, require_admin
from app.models.user import UserData

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/industry-settings", tags=["Industry Settings"])


@router.get("")
async def get_industry_settings(
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Get all industry settings (read access for all authenticated users)."""
    try:
        industry_competencies = await industry_service.get_industry_competencies()
        industry_metadata = await industry_service.get_industry_metadata()
        difficulty_settings = await industry_service.get_difficulty_settings()

        return {
            "success": True,
            "data": {
                "industryCompetencies": industry_competencies,
                "industryMetadata": industry_metadata,
                "difficultySettings": difficulty_settings,
            },
        }
    except Exception as e:
        logger.error(f"Get industry settings error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/competencies")
async def get_industry_competencies(
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Get industry competencies mappings (read access for all authenticated users)."""
    try:
        industry_competencies = await industry_service.get_industry_competencies()

        return {"success": True, "data": industry_competencies}
    except Exception as e:
        logger.error(f"Get industry competencies error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/metadata")
async def get_industry_metadata(
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Get industry metadata (read access for all authenticated users)."""
    try:
        industry_metadata = await industry_service.get_industry_metadata()

        return {"success": True, "data": industry_metadata}
    except Exception as e:
        logger.error(f"Get industry metadata error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/difficulty")
async def get_difficulty_settings(
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Get difficulty settings (read access for all authenticated users)."""
    try:
        difficulty_settings = await industry_service.get_difficulty_settings()

        return {"success": True, "data": difficulty_settings}
    except Exception as e:
        logger.error(f"Get difficulty settings error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/competencies/{industry}/{subcategory}")
async def update_industry_subcategory_competencies(
    industry: str,
    subcategory: str,
    admin: Annotated[UserData, Depends(require_admin)],
    competencyIds: list[str] = Body(...),
):
    """Update industry/subcategory competencies."""
    try:
        if not isinstance(competencyIds, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="competencyIds must be an array",
            )

        success = await industry_service.update_industry_subcategory_competencies(
            industry,
            subcategory,
            competencyIds,
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update industry subcategory competencies",
            )

        return {"success": True, "message": "Industry subcategory competencies updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update industry subcategory competencies error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/focus-area/{industry}/{subcategory}/{focus_area}")
async def update_focus_area_competencies(
    industry: str,
    subcategory: str,
    focus_area: str,
    admin: Annotated[UserData, Depends(require_admin)],
    competencyIds: list[str] = Body(...),
    enabled: bool | None = Body(None),
):
    """Update focus area competencies."""
    try:
        if not isinstance(competencyIds, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="competencyIds must be an array",
            )

        success = await industry_service.update_focus_area_competencies(
            industry,
            subcategory,
            focus_area,
            competencyIds,
            enabled if enabled is not None else True,
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update focus area competencies",
            )

        return {"success": True, "message": "Focus area competencies updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update focus area competencies error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/difficulty/{industry}")
async def save_difficulty_settings(
    industry: str,
    admin: Annotated[UserData, Depends(require_admin)],
    settings: dict[str, Any] = Body(...),
):
    """Save difficulty settings for industry."""
    try:
        if not settings or not isinstance(settings, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid difficulty settings format",
            )

        success = await industry_service.save_difficulty_settings(industry, settings)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save difficulty settings",
            )

        return {"success": True, "message": "Difficulty settings saved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save difficulty settings error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/metadata")
async def save_industry_metadata(
    admin: Annotated[UserData, Depends(require_admin)],
    data: dict[str, Any] = Body(...),
):
    """Save full industry metadata."""
    try:
        if not data or not isinstance(data, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid metadata format",
            )

        success = await industry_service.save_industry_metadata(data)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save industry metadata",
            )

        return {"success": True, "message": "Industry metadata saved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save industry metadata error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/competencies")
async def save_industry_competencies(
    admin: Annotated[UserData, Depends(require_admin)],
    data: dict[str, Any] = Body(...),
):
    """Save full industry competencies."""
    try:
        if not data or not isinstance(data, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid competencies format",
            )

        success = await industry_service.save_industry_competencies(data)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save industry competencies",
            )

        return {"success": True, "message": "Industry competencies saved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save industry competencies error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
