"""
Auth Service
Business logic for authentication operations
"""

import logging
import secrets
from datetime import datetime, timedelta

import bcrypt

from app.config import get_settings
from app.repositories.user_repository import user_repository
from app.repositories.session_repository import session_repository
from app.models.user import UserData, LoginRequest, SignupRequest, AuthResult

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication operations."""

    def __init__(self):
        self.settings = get_settings()
        self.session_expiry_days = self.settings.session_expiry_days

    async def login(self, login_data: LoginRequest) -> AuthResult:
        """Login user."""
        try:
            # Find user by email
            user = await user_repository.find_by_email(login_data.email)
            if not user:
                raise ValueError("Invalid email or password")

            # Verify password
            if not self.verify_password(login_data.password, user.password):
                raise ValueError("Invalid email or password")

            # Generate session token
            session_token = self._generate_session_token()
            expires_at = self._calculate_expiry_date()

            # Create session
            await session_repository.create(user.id, session_token, expires_at)

            # Return user without password
            return AuthResult(
                user=UserData(
                    id=user.id,
                    name=user.name,
                    email=user.email,
                    role=user.role,
                    job_role=user.job_role,
                    created_at=user.created_at,
                ),
                session_token=session_token,
                expires_at=expires_at,
            )
        except Exception as e:
            logger.error(f"Error during login: {e}")
            raise

    async def signup(self, signup_data: SignupRequest) -> AuthResult:
        """Signup new user."""
        try:
            # Check if email already exists
            existing_user = await user_repository.find_by_email(signup_data.email)
            if existing_user:
                raise ValueError("Email already registered")

            # Hash password
            hashed_password = self.hash_password(signup_data.password)

            # Create user
            new_user = await user_repository.create({
                "email": signup_data.email,
                "name": signup_data.name,
                "password": hashed_password,
                "role": signup_data.role or "learner",
                "job_role": signup_data.job_role,
            })

            # Generate session token
            session_token = self._generate_session_token()
            expires_at = self._calculate_expiry_date()

            # Create session
            await session_repository.create(new_user.id, session_token, expires_at)

            return AuthResult(
                user=new_user,
                session_token=session_token,
                expires_at=expires_at,
            )
        except Exception as e:
            logger.error(f"Error during signup: {e}")
            raise

    async def logout(self, session_token: str) -> None:
        """Logout user."""
        try:
            await session_repository.delete_by_token(session_token)
        except Exception as e:
            logger.error(f"Error during logout: {e}")
            raise

    async def verify_session(self, session_token: str) -> UserData | None:
        """Verify session token."""
        try:
            session = await session_repository.find_by_token(session_token)
            if not session:
                return None

            user = await user_repository.find_by_id(session.user_id)
            return user
        except Exception as e:
            logger.error(f"Error verifying session: {e}")
            raise

    async def refresh_session(self, session_token: str) -> datetime:
        """Refresh session (extend expiry)."""
        try:
            session = await session_repository.find_by_token(session_token)
            if not session:
                raise ValueError("Invalid session")

            new_expiry_date = self._calculate_expiry_date()

            # Delete old session and create new one
            await session_repository.delete_by_token(session_token)
            await session_repository.create(session.user_id, session_token, new_expiry_date)

            return new_expiry_date
        except Exception as e:
            logger.error(f"Error refreshing session: {e}")
            raise

    async def change_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str,
    ) -> None:
        """Change user password."""
        try:
            # Get user with password
            user_data = await user_repository.find_by_id(user_id)
            if not user_data:
                raise ValueError("User not found")

            user = await user_repository.find_by_email(user_data.email)
            if not user:
                raise ValueError("User not found")

            # Verify current password
            if not self.verify_password(current_password, user.password):
                raise ValueError("Current password is incorrect")

            # Validate new password
            validation = self.validate_password_strength(new_password)
            if not validation["valid"]:
                raise ValueError(validation.get("message", "Invalid password"))

            # Hash new password
            hashed_password = self.hash_password(new_password)

            # Update password
            await user_repository.update_password(user_id, hashed_password)

            # Invalidate all sessions for this user
            await session_repository.delete_all_for_user(user_id)
        except Exception as e:
            logger.error(f"Error changing password: {e}")
            raise

    async def request_password_reset(self, email: str) -> str:
        """Request password reset."""
        try:
            user = await user_repository.find_by_email(email)
            if not user:
                # Don't reveal if email exists
                raise ValueError("If the email exists, a reset link will be sent")

            # Generate reset token
            reset_token = self._generate_reset_token()

            # In production, you would:
            # 1. Store reset token in database with expiry
            # 2. Send email with reset link

            return reset_token
        except Exception as e:
            logger.error(f"Error requesting password reset: {e}")
            raise

    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions."""
        try:
            return await session_repository.delete_expired()
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {e}")
            raise

    def validate_password_strength(self, password: str) -> dict[str, any]:
        """Validate password strength."""
        if len(password) < self.settings.password_min_length:
            return {
                "valid": False,
                "message": f"Password must be at least {self.settings.password_min_length} characters long",
            }

        if self.settings.require_password_complexity:
            import re
            if not re.search(r"[A-Z]", password):
                return {"valid": False, "message": "Password must contain at least one uppercase letter"}
            if not re.search(r"[a-z]", password):
                return {"valid": False, "message": "Password must contain at least one lowercase letter"}
            if not re.search(r"[0-9]", password):
                return {"valid": False, "message": "Password must contain at least one number"}

        return {"valid": True}

    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password using bcrypt."""
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False

    def _generate_session_token(self) -> str:
        """Generate session token."""
        return secrets.token_hex(32)

    def _generate_reset_token(self) -> str:
        """Generate password reset token."""
        return secrets.token_hex(32)

    def _calculate_expiry_date(self) -> datetime:
        """Calculate session expiry date."""
        return datetime.utcnow() + timedelta(days=self.session_expiry_days)


# Singleton instance
auth_service = AuthService()
