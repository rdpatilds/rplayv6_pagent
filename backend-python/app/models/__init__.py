"""
Pydantic Models
Data models for the application
"""

from app.models.base import BaseModel, TimestampMixin
from app.models.user import (
    CreateUserRequest,
    LoginRequest,
    SignupRequest,
    UpdateUserRequest,
    UserData,
    UserRole,
    UserWithPassword,
    UserWithStats,
)
from app.models.session import SessionData, SessionCreate
from app.models.simulation import (
    ClientProfile,
    DifficultyLevel,
    Industry,
    SimulationData,
    SimulationScore,
    SimulationStatus,
    SimulationWithDetails,
    StartSimulationRequest,
    UpdateSimulationRequest,
)
from app.models.competency import CompetencyData, CreateCompetencyRequest, UpdateCompetencyRequest
from app.models.rubric import CreateRubricRequest, RubricData, RubricEntry, UpdateRubricRequest
from app.models.feedback import CreateFeedbackRequest, FeedbackData, NPSData, UpdateFeedbackRequest
from app.models.parameter import CreateParameterRequest, ParameterData, ParameterType, UpdateParameterRequest
from app.models.engagement import EngagementData, EngagementEventType, CreateEngagementRequest
from app.models.chat import ChatMessage, AIResponse, ObjectiveProgress

__all__ = [
    # Base
    "BaseModel",
    "TimestampMixin",
    # User
    "UserData",
    "UserWithPassword",
    "UserWithStats",
    "UserRole",
    "CreateUserRequest",
    "UpdateUserRequest",
    "LoginRequest",
    "SignupRequest",
    # Session
    "SessionData",
    "SessionCreate",
    # Simulation
    "SimulationData",
    "SimulationWithDetails",
    "SimulationStatus",
    "SimulationScore",
    "StartSimulationRequest",
    "UpdateSimulationRequest",
    "DifficultyLevel",
    "Industry",
    "ClientProfile",
    # Competency
    "CompetencyData",
    "CreateCompetencyRequest",
    "UpdateCompetencyRequest",
    # Rubric
    "RubricData",
    "RubricEntry",
    "CreateRubricRequest",
    "UpdateRubricRequest",
    # Feedback
    "FeedbackData",
    "NPSData",
    "CreateFeedbackRequest",
    "UpdateFeedbackRequest",
    # Parameter
    "ParameterData",
    "ParameterType",
    "CreateParameterRequest",
    "UpdateParameterRequest",
    # Engagement
    "EngagementData",
    "EngagementEventType",
    "CreateEngagementRequest",
    # Chat
    "ChatMessage",
    "AIResponse",
    "ObjectiveProgress",
]
