"""
Parameters Router
Parameter management endpoints
"""

import logging
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, status, Depends, Body

from app.services.parameter_service import parameter_service
from app.middleware.auth import get_current_user, require_admin
from app.models.user import UserData
from app.utils.validation import validate_uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/parameters", tags=["Parameters"])


@router.get("")
async def get_parameters(
    user: Annotated[UserData, Depends(get_current_user)],
    categoryId: str | None = None,
    type: str | None = None,
):
    """Get all parameters or filtered by category/type."""
    try:
        if categoryId:
            parameters = await parameter_service.get_parameters_by_category(categoryId)
        elif type:
            parameters = await parameter_service.get_parameters_by_type(type)
        else:
            parameters = await parameter_service.get_all_parameters()

        return {"success": True, "parameters": [p.model_dump() for p in parameters]}
    except Exception as e:
        logger.error(f"Get parameters error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_parameter(
    admin: Annotated[UserData, Depends(require_admin)],
    name: str = Body(...),
    type: str = Body(...),
    categoryId: str = Body(...),
    value: Any | None = Body(None),
    description: str | None = Body(None),
    metadata: dict[str, Any] | None = Body(None),
):
    """Create new parameter (admin only)."""
    try:
        # Validate required fields
        if not name or not type or not categoryId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: name, type, categoryId",
            )

        # Validate type
        valid_types = ["structured", "narrative", "guardrails"]
        if type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid type. Must be one of: {', '.join(valid_types)}",
            )

        parameter = await parameter_service.create_parameter({
            "name": name,
            "type": type,
            "category_id": categoryId,
            "value": value,
            "description": description,
            "metadata": metadata,
        })

        if not parameter:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create parameter")

        return {"success": True, "parameter": parameter.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create parameter error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/reset")
async def reset_parameters(
    admin: Annotated[UserData, Depends(require_admin)],
):
    """Reset parameters to defaults (admin only)."""
    try:
        await parameter_service.reset_to_defaults()

        return {"success": True, "message": "Parameters reset to defaults successfully"}
    except Exception as e:
        logger.error(f"Reset parameters error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{parameter_id}")
async def get_parameter(
    parameter_id: str,
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Get parameter by ID."""
    try:
        if not validate_uuid(parameter_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid parameter ID format")

        parameter = await parameter_service.get_parameter_by_id(parameter_id)

        if not parameter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parameter not found")

        return {"success": True, "parameter": parameter.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get parameter error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{parameter_id}")
async def update_parameter(
    parameter_id: str,
    admin: Annotated[UserData, Depends(require_admin)],
    name: str | None = Body(None),
    type: str | None = Body(None),
    value: Any | None = Body(None),
    description: str | None = Body(None),
    metadata: dict[str, Any] | None = Body(None),
):
    """Update parameter (admin only)."""
    try:
        if not validate_uuid(parameter_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid parameter ID format")

        # Validate type if provided
        if type:
            valid_types = ["structured", "narrative", "guardrails"]
            if type not in valid_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid type. Must be one of: {', '.join(valid_types)}",
                )

        update_data: dict[str, Any] = {}
        if name is not None:
            update_data["name"] = name
        if type is not None:
            update_data["type"] = type
        if value is not None:
            update_data["value"] = value
        if description is not None:
            update_data["description"] = description
        if metadata is not None:
            update_data["metadata"] = metadata

        updated_parameter = await parameter_service.update_parameter(parameter_id, update_data)

        if not updated_parameter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parameter not found")

        return {"success": True, "parameter": updated_parameter.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update parameter error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{parameter_id}")
async def delete_parameter(
    parameter_id: str,
    admin: Annotated[UserData, Depends(require_admin)],
):
    """Delete parameter (admin only)."""
    try:
        if not validate_uuid(parameter_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid parameter ID format")

        success = await parameter_service.delete_parameter(parameter_id)

        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parameter not found")

        return {"success": True, "message": "Parameter deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete parameter error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
