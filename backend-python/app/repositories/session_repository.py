"""
Session Repository
Database operations for session entities
"""

import logging
from datetime import datetime
from uuid import uuid4

from app.database import fetch, fetchone, execute, record_to_dict, records_to_list
from app.models.session import SessionData

logger = logging.getLogger(__name__)


class SessionRepository:
    """Repository for session database operations."""

    async def find_by_token(self, token: str) -> SessionData | None:
        """Find session by token."""
        try:
            query = """
                SELECT id, user_id, token, expires_at, user_email, user_name, user_role, created_at
                FROM sessions WHERE token = $1 AND expires_at > NOW()
            """
            record = await fetchone(query, token)
            if not record:
                return None
            return SessionData(**record_to_dict(record))
        except Exception as e:
            logger.error(f"Error finding session by token: {e}")
            raise

    async def find_by_user_id(self, user_id: str) -> list[SessionData]:
        """Find all sessions for a user."""
        try:
            query = """
                SELECT id, user_id, token, expires_at, user_email, user_name, user_role, created_at
                FROM sessions WHERE user_id = $1 AND expires_at > NOW()
                ORDER BY created_at DESC
            """
            records = await fetch(query, user_id)
            return [SessionData(**r) for r in records_to_list(records)]
        except Exception as e:
            logger.error(f"Error finding sessions by user ID: {e}")
            raise

    async def create(
        self,
        user_id: str,
        token: str,
        expires_at: datetime,
        user_email: str | None = None,
        user_name: str | None = None,
        user_role: str | None = None,
    ) -> SessionData:
        """Create a new session."""
        try:
            session_id = str(uuid4())

            # If user info not provided, fetch from users table
            if not user_email:
                user_query = "SELECT email, name, role FROM users WHERE id = $1"
                user_record = await fetchone(user_query, user_id)
                if user_record:
                    user_dict = record_to_dict(user_record)
                    user_email = user_dict.get('email')
                    user_name = user_dict.get('name')
                    user_role = user_dict.get('role')

            query = """
                INSERT INTO sessions (user_id, user_email, user_name, user_role, token, expires_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, user_id, token, expires_at, user_email, user_name, user_role, created_at
            """
            record = await fetchone(
                query,
                user_id,
                user_email,
                user_name,
                user_role,
                token,
                expires_at,
            )
            return SessionData(**record_to_dict(record))
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise

    async def delete_by_token(self, token: str) -> None:
        """Delete session by token."""
        try:
            query = "DELETE FROM sessions WHERE token = $1"
            await execute(query, token)
        except Exception as e:
            logger.error(f"Error deleting session by token: {e}")
            raise

    async def delete_all_for_user(self, user_id: str) -> None:
        """Delete all sessions for a user."""
        try:
            query = "DELETE FROM sessions WHERE user_id = $1"
            await execute(query, user_id)
        except Exception as e:
            logger.error(f"Error deleting sessions for user: {e}")
            raise

    async def delete_expired(self) -> int:
        """Delete all expired sessions."""
        try:
            query = "DELETE FROM sessions WHERE expires_at <= NOW()"
            result = await execute(query)
            # Extract count from result string like "DELETE 5"
            if result and "DELETE" in result:
                parts = result.split()
                if len(parts) >= 2:
                    return int(parts[1])
            return 0
        except Exception as e:
            logger.error(f"Error deleting expired sessions: {e}")
            raise

    async def update_expiry(self, token: str, expires_at: datetime) -> None:
        """Update session expiry."""
        try:
            query = "UPDATE sessions SET expires_at = $2 WHERE token = $1"
            await execute(query, token, expires_at)
        except Exception as e:
            logger.error(f"Error updating session expiry: {e}")
            raise

    async def count_active_sessions(self, user_id: str) -> int:
        """Count active sessions for a user."""
        try:
            query = "SELECT COUNT(*) FROM sessions WHERE user_id = $1 AND expires_at > NOW()"
            result = await fetchone(query, user_id)
            return result[0] if result else 0
        except Exception as e:
            logger.error(f"Error counting active sessions: {e}")
            raise


# Singleton instance
session_repository = SessionRepository()
