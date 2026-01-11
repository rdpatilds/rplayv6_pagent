"""
Feedback Router
Feedback management endpoints
"""

import logging
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, status, Depends, Body

from app.services.feedback_service import feedback_service
from app.middleware.auth import get_current_user
from app.models.user import UserData

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.get("")
async def get_feedback(
    user: Annotated[UserData, Depends(get_current_user)],
    simulationId: str | None = None,
    userId: str | None = None,
    competencyId: str | None = None,
    feedbackType: str | None = None,
):
    """Get feedback with optional filters."""
    try:
        # Build filter object
        filters: dict[str, Any] = {}
        if simulationId:
            filters["simulation_id"] = simulationId

        # Non-admins can only see their own feedback
        if userId:
            filters["user_id"] = userId
        elif user.role not in ["super_admin", "company_admin"]:
            filters["user_id"] = user.id

        if competencyId:
            filters["competency_id"] = competencyId
        if feedbackType:
            filters["feedback_type"] = feedbackType

        feedback = await feedback_service.get_feedback(filters)

        return {"success": True, "feedback": [f.model_dump() for f in feedback]}
    except Exception as e:
        logger.error(f"Get feedback error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_feedback(
    user: Annotated[UserData, Depends(get_current_user)],
    simulationId: str = Body(...),
    rating: int = Body(...),
    competencyId: str | None = Body(None),
    comments: str | None = Body(None),
    feedbackType: str | None = Body(None),
):
    """Create feedback."""
    try:
        # Validate required fields
        if not simulationId or rating is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: simulationId, rating",
            )

        # Validate rating range
        if not isinstance(rating, int) or rating < 0 or rating > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating must be a number between 0 and 100",
            )

        # Validate feedback type if provided
        if feedbackType:
            valid_types = ["ai_generated", "user_submitted", "peer_review"]
            if feedbackType not in valid_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid feedback type. Must be one of: {', '.join(valid_types)}",
                )

        feedback = await feedback_service.create_feedback({
            "simulation_id": simulationId,
            "user_id": user.id,
            "competency_id": competencyId,
            "rating": rating,
            "comments": comments,
            "feedback_type": feedbackType or "user_submitted",
        })

        if not feedback:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create feedback")

        return {"success": True, "feedback": feedback.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create feedback error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/nps-stats")
async def get_nps_stats(
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Get NPS statistics."""
    try:
        stats = await feedback_service.get_nps_stats()

        return {"success": True, "stats": stats}
    except Exception as e:
        logger.error(f"Get NPS stats error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
