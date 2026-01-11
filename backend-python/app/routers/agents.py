"""
Agents Router
Health check and status endpoints for Azure AI Agents
"""

import logging
from typing import Any

from fastapi import APIRouter

from app.agents.agent_manager import agent_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get("/health")
async def agents_health() -> dict[str, Any]:
    """
    Get health status of Azure AI Agents.

    Returns:
        Health status dictionary
    """
    health = agent_manager.get_health()
    return health


@router.get("/status")
async def agents_status() -> dict[str, Any]:
    """
    Get detailed status of all Azure AI Agents.

    Returns:
        Status dictionary with agent details
    """
    status = agent_manager.get_status()
    return {
        "success": True,
        "data": status,
    }


@router.get("/info")
async def agents_info() -> dict[str, Any]:
    """
    Get information about available agents.

    Returns:
        Agent information dictionary
    """
    return {
        "success": True,
        "agents": [
            {
                "name": "simulation-client",
                "description": "Simulates client personas in training conversations",
                "capabilities": ["generate_response", "role_play"],
            },
            {
                "name": "profile-generation",
                "description": "Generates realistic client profiles for simulations",
                "capabilities": ["generate_profile", "generate_conversation_starter"],
            },
            {
                "name": "evaluation",
                "description": "Evaluates advisor performance and tracks objectives",
                "capabilities": ["generate_review", "evaluate_objectives"],
            },
            {
                "name": "expert-guidance",
                "description": "Provides expert advice to advisors during simulations",
                "capabilities": ["generate_guidance"],
            },
        ],
        "azure_configured": agent_manager.is_azure_configured,
        "fallback_available": bool(agent_manager.settings.openai_api_key),
    }
