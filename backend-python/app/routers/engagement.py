"""
Engagement Router
Engagement tracking endpoints
"""

import logging
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, status, Depends, Body

from app.services.engagement_service import engagement_service
from app.middleware.auth import get_current_user
from app.models.user import UserData

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/engagement", tags=["Engagement"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def track_engagement(
    user: Annotated[UserData, Depends(get_current_user)],
    eventType: str = Body(...),
    simulationId: str | None = Body(None),
    eventData: dict[str, Any] | None = Body(None),
    sessionId: str | None = Body(None),
):
    """Track engagement event."""
    try:
        # Validate required fields
        if not eventType:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required field: eventType",
            )

        # Validate event type
        valid_event_types = ["login", "simulation_start", "simulation_complete", "page_view", "interaction"]
        if eventType not in valid_event_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid event type. Must be one of: {', '.join(valid_event_types)}",
            )

        engagement = await engagement_service.track_engagement({
            "user_id": user.id,
            "event_type": eventType,
            "simulation_id": simulationId,
            "event_data": eventData,
            "session_id": sessionId,
        })

        if not engagement:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to track engagement")

        return {"success": True, "engagement": engagement.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Track engagement error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/stats")
async def get_engagement_stats(
    user: Annotated[UserData, Depends(get_current_user)],
    userId: str | None = None,
):
    """Get engagement statistics."""
    try:
        # Non-admins can only view their own stats
        target_user_id = userId if (user.role in ["super_admin", "company_admin"] and userId) else user.id

        stats = await engagement_service.get_engagement_stats(target_user_id)

        return {"success": True, "stats": stats}
    except Exception as e:
        logger.error(f"Get engagement stats error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/history")
async def get_engagement_history(
    user: Annotated[UserData, Depends(get_current_user)],
    userId: str | None = None,
    startDate: str | None = None,
    endDate: str | None = None,
    limit: int = 50,
):
    """Get engagement history."""
    try:
        # Non-admins can only view their own history
        target_user_id = userId if (user.role in ["super_admin", "company_admin"] and userId) else user.id

        # Parse dates if provided
        start_dt = datetime.fromisoformat(startDate) if startDate else None
        end_dt = datetime.fromisoformat(endDate) if endDate else None

        history = await engagement_service.get_engagement_history(
            target_user_id,
            start_dt,
            end_dt,
            limit,
        )

        return {"success": True, "history": [h.model_dump() for h in history]}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid date format: {e}")
    except Exception as e:
        logger.error(f"Get engagement history error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
