"""
Competencies Router
Competency management endpoints
"""

import logging
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, status, Depends, Body

from app.services.competency_service import competency_service
from app.services.industry_service import industry_service
from app.middleware.auth import get_current_user, require_admin
from app.models.user import UserData
from app.utils.validation import validate_uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/competencies", tags=["Competencies"])


@router.get("/industry")
async def get_industry_metadata():
    """Get industry metadata and competencies (no auth required)."""
    try:
        industry_competencies = await industry_service.get_industry_competencies()
        industry_metadata = await industry_service.get_industry_metadata()

        return {
            "success": True,
            "data": {
                "industryCompetencies": industry_competencies,
                "industryMetadata": industry_metadata,
            },
        }
    except Exception as e:
        logger.error(f"Get industry metadata error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("")
async def get_competencies(
    industry: str | None = None,
    category: str | None = None,
):
    """Get all competencies or filtered (no auth required for basic access)."""
    try:
        if industry:
            competencies = await competency_service.get_competencies_by_industry(industry)
        elif category:
            competencies = await competency_service.get_competencies_by_category(category)
        else:
            competencies = await competency_service.get_all_competencies()

        return {"success": True, "competencies": [c.model_dump() for c in competencies]}
    except Exception as e:
        logger.error(f"Get competencies error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_competency(
    admin: Annotated[UserData, Depends(require_admin)],
    name: str = Body(...),
    category: str = Body(...),
    description: str | None = Body(None),
    weight: int | None = Body(None),
    industry: str | None = Body(None),
):
    """Create new competency (admin only)."""
    try:
        # Validate required fields
        if not name or not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: name, category",
            )

        # Validate weight if provided
        if weight is not None and (weight < 0 or weight > 100):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Weight must be between 0 and 100",
            )

        competency = await competency_service.create_competency({
            "name": name,
            "description": description,
            "category": category,
            "weight": weight or 10,
            "industry": industry,
        })

        if not competency:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create competency")

        return {"success": True, "competency": competency.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create competency error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{competency_id}")
async def get_competency(
    competency_id: str,
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Get competency by ID."""
    try:
        if not validate_uuid(competency_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid competency ID format")

        competency = await competency_service.get_competency_by_id(competency_id)

        if not competency:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competency not found")

        return {"success": True, "competency": competency.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get competency error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{competency_id}")
async def update_competency(
    competency_id: str,
    admin: Annotated[UserData, Depends(require_admin)],
    name: str | None = Body(None),
    description: str | None = Body(None),
    category: str | None = Body(None),
    weight: int | None = Body(None),
    industry: str | None = Body(None),
):
    """Update competency (admin only)."""
    try:
        if not validate_uuid(competency_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid competency ID format")

        # Validate weight if provided
        if weight is not None and (weight < 0 or weight > 100):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Weight must be between 0 and 100",
            )

        update_data: dict[str, Any] = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if category is not None:
            update_data["category"] = category
        if weight is not None:
            update_data["weight"] = weight
        if industry is not None:
            update_data["industry"] = industry

        updated_competency = await competency_service.update_competency(competency_id, update_data)

        if not updated_competency:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competency not found")

        return {"success": True, "competency": updated_competency.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update competency error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{competency_id}")
async def delete_competency(
    competency_id: str,
    admin: Annotated[UserData, Depends(require_admin)],
):
    """Delete competency (admin only)."""
    try:
        if not validate_uuid(competency_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid competency ID format")

        success = await competency_service.delete_competency(competency_id)

        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competency not found")

        return {"success": True, "message": "Competency deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete competency error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
