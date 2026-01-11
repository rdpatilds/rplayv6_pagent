"""
User Service
Business logic for user operations
"""

import logging
import re
from typing import Any

from app.repositories.user_repository import user_repository
from app.repositories.simulation_repository import simulation_repository
from app.services.auth_service import auth_service
from app.models.user import UserData, UserWithStats, CreateUserRequest, UpdateUserRequest

logger = logging.getLogger(__name__)


class UserService:
    """Service for user operations."""

    async def get_user_by_id(self, user_id: str) -> UserData | None:
        """Get user by ID."""
        try:
            return await user_repository.find_by_id(user_id)
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            raise

    async def get_user_with_stats(self, user_id: str) -> UserWithStats | None:
        """Get user by ID with statistics."""
        try:
            user = await user_repository.find_by_id(user_id)
            if not user:
                return None

            stats = await simulation_repository.get_user_stats(user_id)

            return UserWithStats(
                **user.model_dump(),
                stats={
                    "totalSimulations": stats["total"],
                    "completedSimulations": stats["completed"],
                    "avgScore": stats["avgScore"],
                },
            )
        except Exception as e:
            logger.error(f"Error getting user with stats: {e}")
            raise

    async def get_user_by_email(self, email: str) -> UserData | None:
        """Get user by email."""
        try:
            user = await user_repository.find_by_email(email)
            if not user:
                return None

            # Return without password
            return UserData(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                job_role=user.job_role,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            raise

    async def get_all_users(self) -> list[UserData]:
        """Get all users."""
        try:
            return await user_repository.find_all()
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            raise

    async def create_user(self, user_data: CreateUserRequest | dict[str, Any]) -> UserData:
        """Create new user."""
        try:
            if isinstance(user_data, CreateUserRequest):
                data = user_data.model_dump()
            else:
                data = user_data

            # Validate email format
            if not self._is_valid_email(data.get("email", "")):
                raise ValueError("Invalid email format")

            # Check if email already exists
            existing_user = await user_repository.find_by_email(data["email"])
            if existing_user:
                raise ValueError("Email already registered")

            # Validate password strength if provided
            if data.get("password"):
                password_validation = auth_service.validate_password_strength(data["password"])
                if not password_validation["valid"]:
                    raise ValueError(password_validation.get("message", "Invalid password"))

                # Hash password
                data["password"] = auth_service.hash_password(data["password"])

            return await user_repository.create(data)
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise

    async def update_user(self, user_id: str, user_data: UpdateUserRequest | dict[str, Any]) -> UserData:
        """Update user."""
        try:
            if isinstance(user_data, UpdateUserRequest):
                data = user_data.model_dump(exclude_unset=True)
            else:
                data = {k: v for k, v in user_data.items() if v is not None}

            # Validate email format if provided
            if data.get("email") and not self._is_valid_email(data["email"]):
                raise ValueError("Invalid email format")

            # Check if new email already exists
            if data.get("email"):
                existing_user = await user_repository.find_by_email(data["email"])
                if existing_user and existing_user.id != user_id:
                    raise ValueError("Email already registered")

            # Hash password if provided
            if data.get("password"):
                data["password"] = auth_service.hash_password(data["password"])

            return await user_repository.update(user_id, data)
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise

    async def delete_user(self, user_id: str) -> None:
        """Delete user."""
        try:
            # Check if user exists
            user = await user_repository.find_by_id(user_id)
            if not user:
                raise ValueError("User not found")

            await user_repository.delete(user_id)
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            raise

    async def bulk_create_users(self, users: list[CreateUserRequest | dict[str, Any]]) -> list[UserData]:
        """Bulk create users."""
        try:
            processed_users = []
            for user_data in users:
                if isinstance(user_data, CreateUserRequest):
                    data = user_data.model_dump()
                else:
                    data = user_data

                # Validate email
                if not self._is_valid_email(data.get("email", "")):
                    continue

                # Hash password
                if data.get("password"):
                    data["password"] = auth_service.hash_password(data["password"])

                processed_users.append(data)

            return await user_repository.bulk_create(processed_users)
        except Exception as e:
            logger.error(f"Error bulk creating users: {e}")
            raise

    async def email_exists(self, email: str) -> bool:
        """Check if email exists."""
        try:
            return await user_repository.email_exists(email)
        except Exception as e:
            logger.error(f"Error checking email existence: {e}")
            raise

    async def get_users_by_role(self, role: str | None = None) -> list[UserData]:
        """Get users by role."""
        try:
            all_users = await user_repository.find_all()
            if role:
                return [user for user in all_users if user.role == role]
            return all_users
        except Exception as e:
            logger.error(f"Error getting users by role: {e}")
            raise

    async def update_profile(self, user_id: str, profile_data: dict[str, Any]) -> UserData:
        """Update user profile."""
        try:
            return await user_repository.update(user_id, profile_data)
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            raise

    async def get_user_activity_summary(self, user_id: str) -> dict[str, Any]:
        """Get user activity summary."""
        try:
            user = await user_repository.find_by_id(user_id)
            if not user:
                raise ValueError("User not found")

            stats = await simulation_repository.get_user_stats(user_id)
            recent_simulations = await simulation_repository.find_by_user_id(user_id)

            return {
                "user": user.model_dump(),
                "simulations": {
                    "total": stats["total"],
                    "completed": stats["completed"],
                    "inProgress": stats["total"] - stats["completed"],
                    "avgScore": stats["avgScore"],
                },
                "recentSimulations": [s.model_dump() for s in recent_simulations[:5]],
            }
        except Exception as e:
            logger.error(f"Error getting user activity summary: {e}")
            raise

    async def get_user_count_by_role(self) -> dict[str, int]:
        """Get user count by role."""
        try:
            all_users = await user_repository.find_all()
            counts: dict[str, int] = {
                "super_admin": 0,
                "company_admin": 0,
                "trainer": 0,
                "learner": 0,
            }

            for user in all_users:
                if user.role in counts:
                    counts[user.role] += 1

            return counts
        except Exception as e:
            logger.error(f"Error getting user count by role: {e}")
            raise

    async def search_users(self, query: str) -> list[UserData]:
        """Search users by name or email."""
        try:
            all_users = await user_repository.find_all()
            lower_query = query.lower()

            return [
                user for user in all_users
                if lower_query in user.name.lower() or lower_query in user.email.lower()
            ]
        except Exception as e:
            logger.error(f"Error searching users: {e}")
            raise

    def _is_valid_email(self, email: str) -> bool:
        """Validate email format."""
        email_regex = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
        return bool(re.match(email_regex, email))


# Singleton instance
user_service = UserService()
