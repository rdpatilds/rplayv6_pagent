"""
Routers Module
FastAPI route handlers
"""

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.simulation import router as simulation_router
from app.routers.chat import router as chat_router
from app.routers.competencies import router as competencies_router
from app.routers.parameters import router as parameters_router
from app.routers.feedback import router as feedback_router
from app.routers.engagement import router as engagement_router
from app.routers.industry_settings import router as industry_settings_router
from app.routers.difficulty import router as difficulty_router

__all__ = [
    "auth_router",
    "users_router",
    "simulation_router",
    "chat_router",
    "competencies_router",
    "parameters_router",
    "feedback_router",
    "engagement_router",
    "industry_settings_router",
    "difficulty_router",
]
