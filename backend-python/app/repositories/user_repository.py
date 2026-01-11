"""
User Repository
Database operations for user entities
"""

import logging
from typing import Any
from uuid import uuid4

from app.database import fetch, fetchone, execute, record_to_dict, records_to_list
from app.models.user import UserData, UserWithPassword, CreateUserRequest, UpdateUserRequest

logger = logging.getLogger(__name__)


class UserRepository:
    """Repository for user database operations."""

    async def find_by_id(self, user_id: str) -> UserData | None:
        """Find user by ID."""
        try:
            query = """
                SELECT id, name, email, role, job_role, created_at
                FROM users WHERE id = $1
            """
            record = await fetchone(query, user_id)
            if not record:
                return None
            return UserData(**record_to_dict(record))
        except Exception as e:
            logger.error(f"Error finding user by ID: {e}")
            raise

    async def find_by_email(self, email: str) -> UserWithPassword | None:
        """Find user by email (includes password for auth)."""
        try:
            query = """
                SELECT id, name, email, password, role, job_role, created_at
                FROM users WHERE email = $1
            """
            record = await fetchone(query, email.lower())
            if not record:
                return None
            return UserWithPassword(**record_to_dict(record))
        except Exception as e:
            logger.error(f"Error finding user by email: {e}")
            raise

    async def find_all(self) -> list[UserData]:
        """Get all users."""
        try:
            query = """
                SELECT id, name, email, role, job_role, created_at
                FROM users ORDER BY created_at DESC
            """
            records = await fetch(query)
            return [UserData(**r) for r in records_to_list(records)]
        except Exception as e:
            logger.error(f"Error fetching all users: {e}")
            raise

    async def create(self, user_data: CreateUserRequest | dict[str, Any]) -> UserData:
        """Create a new user."""
        try:
            if isinstance(user_data, CreateUserRequest):
                data = user_data.model_dump()
            else:
                data = user_data

            user_id = str(uuid4())
            query = """
                INSERT INTO users (id, name, email, password, role, job_role)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, name, email, role, job_role, created_at
            """
            record = await fetchone(
                query,
                user_id,
                data["name"],
                data["email"].lower(),
                data["password"],
                data.get("role", "learner"),
                data.get("job_role"),
            )
            return UserData(**record_to_dict(record))
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise

    async def update(self, user_id: str, user_data: UpdateUserRequest | dict[str, Any]) -> UserData:
        """Update a user."""
        try:
            if isinstance(user_data, UpdateUserRequest):
                data = user_data.model_dump(exclude_unset=True)
            else:
                data = {k: v for k, v in user_data.items() if v is not None}

            # Build dynamic update query
            update_parts = []
            params = [user_id]
            param_idx = 2

            for key, value in data.items():
                if key == "email" and value:
                    value = value.lower()
                update_parts.append(f"{key} = ${param_idx}")
                params.append(value)
                param_idx += 1

            if not update_parts:
                # No updates, just return current user
                return await self.find_by_id(user_id)

            query = f"""
                UPDATE users SET {', '.join(update_parts)}
                WHERE id = $1
                RETURNING id, name, email, role, job_role, created_at
            """
            record = await fetchone(query, *params)
            if not record:
                raise ValueError("User not found")
            return UserData(**record_to_dict(record))
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise

    async def delete(self, user_id: str) -> None:
        """Delete a user."""
        try:
            query = "DELETE FROM users WHERE id = $1"
            await execute(query, user_id)
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            raise

    async def update_password(self, user_id: str, hashed_password: str) -> None:
        """Update user password."""
        try:
            query = "UPDATE users SET password = $2 WHERE id = $1"
            await execute(query, user_id, hashed_password)
        except Exception as e:
            logger.error(f"Error updating password: {e}")
            raise

    async def email_exists(self, email: str) -> bool:
        """Check if email exists."""
        try:
            query = "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)"
            result = await fetchone(query, email.lower())
            return result[0] if result else False
        except Exception as e:
            logger.error(f"Error checking email existence: {e}")
            raise

    async def bulk_create(self, users: list[CreateUserRequest | dict[str, Any]]) -> list[UserData]:
        """Bulk create users."""
        created_users = []
        for user_data in users:
            try:
                user = await self.create(user_data)
                created_users.append(user)
            except Exception as e:
                logger.error(f"Error creating user in bulk: {e}")
                # Continue with other users
        return created_users


# Singleton instance
user_repository = UserRepository()
