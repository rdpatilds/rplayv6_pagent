"""
Users Router
User management endpoints
"""

import csv
import io
import json
import logging
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, status, Depends, Body

from app.services.user_service import user_service
from app.middleware.auth import get_current_user, require_admin, require_ownership_or_admin
from app.models.user import UserData, CreateUserRequest, UpdateUserRequest, BulkImportResult
from app.utils.validation import validate_email, validate_uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("")
async def get_all_users(
    admin: Annotated[UserData, Depends(require_admin)],
):
    """Get all users (admin only)."""
    try:
        users = await user_service.get_all_users()
        return {"success": True, "users": [u.model_dump() for u in users]}
    except Exception as e:
        logger.error(f"Get users error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(
    admin: Annotated[UserData, Depends(require_admin)],
    first_name: str = Body(..., alias="firstName"),
    last_name: str = Body(..., alias="lastName"),
    email: str = Body(...),
    password: str = Body(...),
    role: str = Body(...),
    job_role: str | None = Body(None, alias="jobRole"),
):
    """Create a single user (admin only)."""
    try:
        # Validate required fields
        if not first_name or not last_name or not email or not password or not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: firstName, lastName, email, password, role",
            )

        # Validate email format
        if not validate_email(email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")

        # Validate role
        valid_roles = ["super_admin", "company_admin", "trainer", "learner"]
        if role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}",
            )

        # Construct full name
        name = f"{first_name} {last_name}".strip()

        user = await user_service.create_user({
            "name": name,
            "email": email,
            "password": password,
            "role": role,
            "job_role": job_role,
        })

        return {"success": True, "user": user.model_dump()}
    except ValueError as e:
        if "already" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create user error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: Annotated[UserData, Depends(get_current_user)],
):
    """Get user by ID (auth required, self or admin)."""
    try:
        if not validate_uuid(user_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format")

        # Check permissions
        require_ownership_or_admin(current_user, user_id)

        user = await user_service.get_user_with_stats(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return {"success": True, "user": user.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    admin: Annotated[UserData, Depends(require_admin)],
    first_name: str = Body(..., alias="firstName"),
    last_name: str = Body(..., alias="lastName"),
    email: str = Body(...),
    role: str = Body(...),
    password: str | None = Body(None),
    job_role: str | None = Body(None, alias="jobRole"),
):
    """Update user (admin only)."""
    try:
        if not validate_uuid(user_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format")

        # Validate required fields
        if not first_name or not last_name or not email or not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: firstName, lastName, email, role",
            )

        # Validate email format
        if not validate_email(email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")

        # Validate role
        valid_roles = ["super_admin", "company_admin", "trainer", "learner"]
        if role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}",
            )

        # Construct full name
        name = f"{first_name} {last_name}".strip()

        update_data: dict[str, Any] = {
            "name": name,
            "email": email,
            "role": role,
            "job_role": job_role,
        }

        # Only include password if provided
        if password:
            update_data["password"] = password

        updated_user = await user_service.update_user(user_id, update_data)

        return {"success": True, "user": updated_user.model_dump()}
    except ValueError as e:
        if "already" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update user error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    admin: Annotated[UserData, Depends(require_admin)],
):
    """Delete user (admin only)."""
    try:
        if not validate_uuid(user_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format")

        await user_service.delete_user(user_id)

        return {"success": True, "message": "User deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete user error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/bulk-import")
async def bulk_import_users(
    admin: Annotated[UserData, Depends(require_admin)],
    import_method: str = Body(None, alias="importMethod"),
    users: list[dict[str, Any]] | None = Body(None),
    csv_data: str | None = Body(None, alias="csvData"),
    json_data: str | list[dict[str, Any]] | None = Body(None, alias="jsonData"),
):
    """Bulk import users (admin only)."""
    try:
        users_to_create: list[dict[str, Any]] = []

        # Parse CSV data
        if import_method == "csv" and csv_data:
            reader = csv.DictReader(io.StringIO(csv_data))
            for row in reader:
                users_to_create.append({
                    "firstName": row.get("firstName", ""),
                    "lastName": row.get("lastName", ""),
                    "email": row.get("email", ""),
                    "password": row.get("password", ""),
                    "role": row.get("role", "learner"),
                    "jobRole": row.get("jobRole"),
                })
        # Parse JSON data
        elif import_method == "json" and json_data:
            parsed_users = json.loads(json_data) if isinstance(json_data, str) else json_data
            for user in parsed_users:
                users_to_create.append({
                    **user,
                    "role": user.get("role", "learner"),
                    "jobRole": user.get("jobRole"),
                })
        # Direct users array
        elif users and isinstance(users, list):
            for user in users:
                users_to_create.append({
                    **user,
                    "role": user.get("role", "learner"),
                    "jobRole": user.get("jobRole"),
                })
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid import method or no data provided",
            )

        if not users_to_create:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No users provided or invalid format",
            )

        results = BulkImportResult(success=0, failed=0, errors=[])
        valid_roles = ["super_admin", "company_admin", "trainer", "learner"]

        for user_data in users_to_create:
            first_name = user_data.get("firstName", "")
            last_name = user_data.get("lastName", "")
            email = user_data.get("email", "")
            password = user_data.get("password", "")
            role = user_data.get("role", "learner").lower()
            job_role = user_data.get("jobRole")

            # Validate required fields
            if not first_name or not last_name or not email or not password:
                results.failed += 1
                results.errors.append(f"User {email or 'unknown'}: Missing required fields")
                continue

            # Validate email
            if not validate_email(email):
                results.failed += 1
                results.errors.append(f"User {email}: Invalid email format")
                continue

            # Validate role
            if role not in valid_roles:
                results.failed += 1
                results.errors.append(f"User {email}: Invalid role. Must be one of: {', '.join(valid_roles)}")
                continue

            try:
                name = f"{first_name} {last_name}".strip()
                await user_service.create_user({
                    "name": name,
                    "email": email,
                    "password": password,
                    "role": role,
                    "job_role": job_role,
                })
                results.success += 1
            except Exception as e:
                logger.error(f"Error creating user {email}: {e}")
                results.failed += 1
                results.errors.append(f"User {email}: {str(e)}")

        return {"success": True, "results": results.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk import error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
