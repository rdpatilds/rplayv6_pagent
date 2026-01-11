"""
Backend Configuration
Centralized configuration for backend services using pydantic-settings
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = Field(default="", description="PostgreSQL connection string")

    # Authentication
    session_expiry_days: int = Field(default=30, description="Session expiry in days")
    password_min_length: int = Field(default=8, description="Minimum password length")
    require_password_complexity: bool = Field(default=True, description="Require complex passwords")

    # OpenAI
    openai_api_key: str = Field(default="", description="OpenAI API key")
    openai_default_model: str = Field(default="gpt-4", description="Default OpenAI model")
    openai_default_temperature: float = Field(default=0.7, description="Default temperature")
    openai_max_tokens: int = Field(default=500, description="Max tokens for completion")

    # Azure AI Agents
    azure_ai_project_endpoint: str = Field(default="", description="Azure AI Project endpoint")
    azure_ai_model_deployment_name: str = Field(default="gpt-4o", description="Azure model deployment name")
    azure_ai_agent_name_prefix: str = Field(default="rplay-", description="Agent name prefix")
    azure_ai_api_key: str = Field(default="", description="Azure AI API key (not currently supported)")

    # Azure Service Principal (optional)
    azure_client_id: str = Field(default="", description="Azure client ID")
    azure_client_secret: str = Field(default="", description="Azure client secret")
    azure_tenant_id: str = Field(default="", description="Azure tenant ID")

    # Email
    email_host: str = Field(default="", description="SMTP host")
    email_port: int = Field(default=587, description="SMTP port")
    email_secure: bool = Field(default=False, description="Use TLS")
    email_user: str = Field(default="", description="SMTP username")
    email_password: str = Field(default="", description="SMTP password")
    email_from: str = Field(default="noreply@simulator.com", description="From address")

    # App
    app_url: str = Field(default="http://localhost:3000", description="Frontend URL")
    environment: str = Field(default="development", alias="ENVIRONMENT", description="Environment name")
    port: int = Field(default=3001, description="Server port")
    log_level: str = Field(default="info", description="Log level")

    # API Rate Limiting
    rate_limit_enabled: bool = Field(default=False, description="Enable rate limiting")
    rate_limit_max_requests: int = Field(default=100, description="Max requests per window")
    rate_limit_window_ms: int = Field(default=900000, description="Rate limit window in ms")

    # Features
    enable_email_notifications: bool = Field(default=False, description="Enable email notifications")
    enable_engagement_tracking: bool = Field(default=True, description="Enable engagement tracking")
    enable_ai_evaluation: bool = Field(default=True, description="Enable AI evaluation")

    # Simulation defaults
    default_difficulty_level: int = Field(default=3, description="Default difficulty level")
    max_conversation_length: int = Field(default=50, description="Max conversation messages")
    session_timeout_minutes: int = Field(default=60, description="Session timeout in minutes")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


def validate_config() -> dict[str, list[str]]:
    """
    Validate required environment variables.

    Returns:
        Dictionary with 'errors' and 'warnings' lists.
    """
    settings = get_settings()
    errors: list[str] = []
    warnings: list[str] = []

    if not settings.database_url:
        errors.append("DATABASE_URL is required")

    # Check if at least one AI provider is configured
    has_openai = bool(settings.openai_api_key)
    has_azure = bool(settings.azure_ai_project_endpoint)

    if not has_openai and not has_azure:
        errors.append("At least one AI provider is required: OPENAI_API_KEY or AZURE_AI_PROJECT_ENDPOINT")

    if has_azure and not has_openai:
        warnings.append("OpenAI is not configured. Fallback to OpenAI will not work if Azure agents fail.")

    if not has_azure:
        warnings.append("Azure AI Agents not configured. Using OpenAI directly.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }


def is_azure_configured() -> bool:
    """Check if Azure AI Agents is configured."""
    return bool(get_settings().azure_ai_project_endpoint)


def is_openai_configured() -> bool:
    """Check if OpenAI is configured."""
    return bool(get_settings().openai_api_key)


def get_environment() -> str:
    """Get environment name."""
    return get_settings().environment


def is_production() -> bool:
    """Check if in production."""
    return get_environment() == "production"


def is_development() -> bool:
    """Check if in development."""
    return get_environment() == "development"


def get_cors_origins() -> list[str]:
    """Get CORS allowed origins."""
    settings = get_settings()
    return [
        settings.app_url,
        "http://localhost:3000",
        "http://localhost:3002",
        "http://192.168.0.113:3000",
        "http://192.168.0.113:3002",
    ]


def log_config() -> None:
    """Log configuration with sensitive data masked."""
    settings = get_settings()
    masked_config = {
        "database_url": "***" if settings.database_url else "",
        "openai_api_key": "***" if settings.openai_api_key else "",
        "azure_ai_project_endpoint": "***" if settings.azure_ai_project_endpoint else "",
        "azure_ai_api_key": "***" if settings.azure_ai_api_key else "",
        "email_password": "***" if settings.email_password else "",
        "environment": settings.environment,
        "app_url": settings.app_url,
        "port": settings.port,
        "log_level": settings.log_level,
    }
    print(f"Backend Configuration: {masked_config}")
