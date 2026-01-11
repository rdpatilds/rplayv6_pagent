"""
Backend Server Entry Point
FastAPI server that serves the API routes with Socket.io for TTS
"""

import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import DatabasePool, fetch
from app.middleware.error_handler import setup_exception_handlers
from app.services.websocket_tts_service import init_tts_service, get_tts_service, get_socket_app

# Import routers
from app.routers import (
    auth_router,
    users_router,
    simulation_router,
    chat_router,
    competencies_router,
    parameters_router,
    feedback_router,
    engagement_router,
    industry_settings_router,
    difficulty_router,
)
from app.routers.agents import router as agents_router
from app.agents.agent_manager import agent_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Setup CORS origins
cors_origins = [
    settings.app_url,
    "http://localhost:3000",
    "http://localhost:3002",
    "http://192.168.0.113:3000",
    "http://192.168.0.113:3002",
]

# Initialize TTS service at module level (before lifespan)
# This is needed because Socket.io app wrapping must happen at import time
init_tts_service(cors_origins)
logger.info("WebSocket TTS service initialized at module level")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown."""
    logger.info("=" * 50)
    logger.info("Starting backend server...")
    logger.info(f"Environment: {settings.environment}")

    # Initialize database connection pool
    try:
        await DatabasePool.initialize()
        logger.info("Database connected")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")

    # Initialize Azure AI Agents
    try:
        logger.info("=" * 50)
        logger.info("AI Backend Configuration:")
        logger.info(f"  Azure AI configured: {agent_manager.is_azure_configured}")
        logger.info(f"  OpenAI fallback available: {bool(settings.openai_api_key)}")

        if agent_manager.is_azure_configured:
            logger.info("Initializing Azure AI Agents...")
            results = await agent_manager.initialize_all()
            initialized = sum(1 for v in results.values() if v)

            if initialized > 0:
                logger.info(f"✓ Azure AI Agents: {initialized}/{len(results)} agents initialized")
                logger.info("✓ AI Backend: Azure AI Agents (primary)")
            else:
                logger.warning("✗ Azure AI Agents initialization failed")
                logger.info("✓ AI Backend: OpenAI (fallback)")
        else:
            logger.info("Azure AI Agents not configured")
            logger.info("✓ AI Backend: OpenAI (fallback)")
        logger.info("=" * 50)
    except Exception as e:
        logger.error(f"Azure AI Agents initialization failed: {e}")
        logger.info("✓ AI Backend: OpenAI (fallback due to error)")

    logger.info("WebSocket TTS service initialized")
    logger.info("=" * 50)

    yield

    # Shutdown
    logger.info("Shutting down...")
    await DatabasePool.close()

    # Cleanup Azure AI Agents
    try:
        await agent_manager.cleanup_all()
        logger.info("Azure AI Agents cleaned up")
    except Exception as e:
        logger.error(f"Azure AI Agents cleanup error: {e}")

    tts_service = get_tts_service()
    if tts_service:
        await tts_service.shutdown()
    logger.info("Server shutdown complete")


# Create FastAPI application
fastapi_app = FastAPI(
    title="AI Simulation Platform API",
    description="Backend API for the AI Simulation Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Setup CORS
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup exception handlers
setup_exception_handlers(fastapi_app)


# Request logging middleware
@fastapi_app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests."""
    logger.info(f"{request.method} {request.url.path} - Query: {dict(request.query_params)}")
    response = await call_next(request)
    return response


# Health check endpoint
@fastapi_app.get("/health")
async def health_check() -> dict[str, Any]:
    """Health check endpoint."""
    tts_service = get_tts_service()
    return {
        "status": "healthy",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
        "environment": settings.environment,
        "tts": {
            "enabled": bool(settings.openai_api_key),
            "activeConnections": tts_service.get_stats()["activeConnections"] if tts_service else 0,
        },
    }


# Database health check
@fastapi_app.get("/api/health/db")
async def db_health_check() -> dict[str, Any]:
    """Database connection health check."""
    try:
        await fetch("SELECT 1 as test")
        return {
            "status": "connected",
            "database": "postgresql (Neon)",
            "message": "Database connection successful",
        }
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
            },
        )


# TTS stats endpoint
@fastapi_app.get("/api/tts/stats")
async def get_tts_stats() -> dict[str, Any]:
    """Get TTS service statistics."""
    tts_service = get_tts_service()
    if tts_service:
        return tts_service.get_stats()
    return {"activeConnections": 0, "connections": []}


# API info endpoint
@fastapi_app.get("/api")
async def api_info() -> dict[str, Any]:
    """API information endpoint."""
    return {
        "message": "AI Simulation Platform API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "dbHealth": "/api/health/db",
            "auth": "/api/auth/*",
            "users": "/api/users/*",
            "simulation": "/api/simulation/*",
            "parameters": "/api/parameters/*",
            "competencies": "/api/competencies/*",
            "feedback": "/api/feedback/*",
            "engagement": "/api/engagement/*",
            "difficulty": "/api/difficulty/*",
            "chat": "/api/chat/*",
            "industrySettings": "/api/industry-settings/*",
            "tts": "/api/tts/stats",
        },
    }


# Mount API routers
fastapi_app.include_router(auth_router, prefix="/api")
fastapi_app.include_router(users_router, prefix="/api")
fastapi_app.include_router(simulation_router, prefix="/api")
fastapi_app.include_router(chat_router, prefix="/api")
fastapi_app.include_router(competencies_router, prefix="/api")
fastapi_app.include_router(parameters_router, prefix="/api")
fastapi_app.include_router(feedback_router, prefix="/api")
fastapi_app.include_router(engagement_router, prefix="/api")
fastapi_app.include_router(industry_settings_router, prefix="/api")
fastapi_app.include_router(difficulty_router, prefix="/api")
fastapi_app.include_router(agents_router, prefix="/api")


# 404 handler
@fastapi_app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors."""
    return JSONResponse(
        status_code=404,
        content={"success": False, "error": "Endpoint not found"},
    )


# Create the combined ASGI app that wraps FastAPI with Socket.io
# Socket.io handles /socket.io/ requests and passes everything else to FastAPI
app = get_socket_app(fastapi_app)


if __name__ == "__main__":
    import uvicorn

    port = int(settings.port or 3001)
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.environment == "development",
    )
