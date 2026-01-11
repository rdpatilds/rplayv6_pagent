"""
Chat Router
AI chat endpoints
"""

import json
import logging
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, status, Body

from app.config import get_settings
from app.services.ai_service import ai_service
from app.models.chat import ChatMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

# In-memory API key storage (in production, use secure storage)
stored_api_key = ""


def get_difficulty_guidelines(difficulty: str) -> str:
    """Get difficulty-specific guidelines for the AI."""
    difficulty_lower = difficulty.lower()
    if difficulty_lower == "beginner":
        return "Be friendly, cooperative, and open. Provide information readily when asked. You have basic financial knowledge but need explanations for industry-specific concepts."
    elif difficulty_lower == "intermediate":
        return "Be somewhat reserved and hesitant to share all information immediately. Some of your financial details and goals should only be revealed when asked specifically or when trust is established."
    elif difficulty_lower == "advanced":
        return "Be skeptical, challenging, and resistant initially. You should question recommendations, raise objections, and only reveal sensitive information after significant trust-building."
    return "Be friendly and cooperative, with a balanced approach to sharing information."


def build_system_prompt(
    client_profile: dict[str, Any],
    personality_settings: dict[str, Any],
    simulation_settings: dict[str, Any],
) -> str:
    """Build system prompt for client simulation."""
    return f"""You are an AI client in a training simulation. Your role is to behave as a realistic client with the personality traits, background, and needs specified below. Respond naturally and conversationally, avoiding robotic language or self-references as an AI.

IMPORTANT: You are the CLIENT, not the advisor. Respond as if you are seeking financial advice, not giving it.

Client Profile:
- Name: {client_profile.get('name', 'Unknown')}
- Age: {client_profile.get('age', 'Unknown')}
- Occupation: {client_profile.get('occupation', 'Unknown')}
- Income: {client_profile.get('income', 'Unknown')}
- Family Status: {client_profile.get('family', 'Unknown')}
- Goals: {', '.join(client_profile.get('goals', [])) if client_profile.get('goals') else 'Not specified'}

Personality:
- Mood: {personality_settings.get('mood', 'neutral')}
- Archetype: {personality_settings.get('archetype', 'Standard Client')}

Industry Context: {simulation_settings.get('industry', 'Unknown')}{f" - {simulation_settings.get('subcategory')}" if simulation_settings.get('subcategory') else ''}
Difficulty Level: {simulation_settings.get('difficulty', 'Unknown')}

{get_difficulty_guidelines(simulation_settings.get('difficulty', 'beginner'))}

For your first response, introduce yourself briefly with just your name and a general reason for meeting with the advisor. Keep it natural and conversational.

IMPORTANT: Your name is {client_profile.get('name', 'Unknown')}. Always use this name when introducing yourself."""


def build_expert_prompt(
    client_profile: dict[str, Any],
    personality_settings: dict[str, Any],
    simulation_settings: dict[str, Any],
    objectives: list[dict[str, Any]] | None,
) -> str:
    """Build expert guidance prompt."""
    competencies_text = ", ".join(simulation_settings.get("competencies", [])) if simulation_settings.get("competencies") else "None specified"
    objectives_text = "\n".join([f"- {obj.get('name', '')}: {obj.get('progress', 0)}% complete" for obj in (objectives or [])]) if objectives else "No objectives data available"

    return f"""You are an expert financial advisor trainer providing guidance to an advisor in a simulation.
The advisor is practicing with a simulated client and has asked for your help.

Client Profile:
- Name: {client_profile.get('name', 'Unknown')}
- Age: {client_profile.get('age', 'Unknown')}
- Occupation: {client_profile.get('occupation', 'Unknown')}
- Goals: {', '.join(client_profile.get('goals', [])) if client_profile.get('goals') else 'Unknown'}

Industry Context: {simulation_settings.get('industry', 'Unknown')}{f" - {simulation_settings.get('subcategory')}" if simulation_settings.get('subcategory') else ''}
Difficulty Level: {simulation_settings.get('difficulty', 'Unknown')}

Competencies Being Evaluated: {competencies_text}

Current Objectives Progress:
{objectives_text}

Provide clear, practical, and supportive guidance to help the advisor succeed in this simulation.

Remember that you are NOT the client - you are a trainer helping the advisor."""


@router.post("/client-response")
async def client_response(
    messages: list[dict[str, Any]] = Body(...),
    client_profile: dict[str, Any] = Body(..., alias="clientProfile"),
    personality_settings: dict[str, Any] | None = Body(None, alias="personalitySettings"),
    simulation_settings: dict[str, Any] = Body(..., alias="simulationSettings"),
    api_key: str | None = Body(None, alias="apiKey"),
):
    """Generate AI client response."""
    global stored_api_key

    try:
        settings = get_settings()
        effective_api_key = api_key or stored_api_key or settings.openai_api_key

        if not effective_api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OpenAI API key is missing. Please configure it in the API Settings page.",
            )

        # Default personality settings
        personality = personality_settings or {
            "mood": "neutral",
            "archetype": "Standard Client",
            "traits": {"openness": 50, "agreeableness": 50, "conscientiousness": 50, "neuroticism": 50, "extraversion": 50},
            "influence": "balanced",
        }

        # Build system prompt
        system_prompt = build_system_prompt(client_profile, personality, simulation_settings)

        # Format messages
        formatted_messages = [
            {"role": "system", "content": system_prompt},
            *[m for m in messages if m.get("role") != "system"],
        ]

        logger.info(f"[CHAT] Generating client response for simulation {simulation_settings.get('simulationId')}")

        # Generate response using OpenAI
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {effective_api_key}",
                },
                json={
                    "model": "gpt-4o",
                    "messages": formatted_messages,
                    "temperature": 0.7,
                    "max_tokens": 1000,
                },
                timeout=60.0,
            )

            if response.status_code != 200:
                logger.error(f"OpenAI API error: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="I'm sorry, I'm having trouble responding right now.",
                )

            data = response.json()
            client_response_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        # Evaluate objectives if we have enough messages
        objective_progress = None
        if len(messages) > 2:
            try:
                objective_progress = await ai_service.evaluate_objectives(messages, effective_api_key)
                if objective_progress:
                    objective_progress = objective_progress.model_dump()
            except Exception as e:
                logger.error(f"[CHAT] Error evaluating objectives: {e}")

        logger.info(f"[CHAT] Successfully generated response for simulation {simulation_settings.get('simulationId')}")

        return {
            "success": True,
            "message": client_response_text,
            "objectiveProgress": objective_progress,
            "source": "openai",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[CHAT] Error generating client response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="I'm sorry, I'm having trouble responding right now. Let's continue our conversation in a moment.",
        )


@router.post("/expert-response")
async def expert_response(
    messages: list[dict[str, Any]] = Body(...),
    client_profile: dict[str, Any] = Body(..., alias="clientProfile"),
    personality_settings: dict[str, Any] | None = Body(None, alias="personalitySettings"),
    simulation_settings: dict[str, Any] = Body(..., alias="simulationSettings"),
    objectives: list[dict[str, Any]] | None = Body(None),
    api_key: str | None = Body(None, alias="apiKey"),
):
    """Generate expert guidance."""
    global stored_api_key

    try:
        settings = get_settings()
        effective_api_key = api_key or stored_api_key or settings.openai_api_key

        if not effective_api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OpenAI API key is missing. Please configure it in the API Settings page.",
            )

        # Default personality settings
        personality = personality_settings or {
            "mood": "neutral",
            "archetype": "Standard Client",
            "traits": {},
            "influence": "balanced",
        }

        # Build expert prompt
        expert_prompt = build_expert_prompt(client_profile, personality, simulation_settings, objectives)

        # Format messages
        formatted_messages = [
            {"role": "system", "content": expert_prompt},
            *[m for m in messages if m.get("role") != "system"],
        ]

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {effective_api_key}",
                },
                json={
                    "model": "gpt-4o",
                    "messages": formatted_messages,
                    "temperature": 0.7,
                    "max_tokens": 1000,
                },
                timeout=60.0,
            )

            if response.status_code != 200:
                logger.error(f"OpenAI API error: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="I'm sorry, I'm having trouble providing guidance right now.",
                )

            data = response.json()
            expert_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        return {
            "success": True,
            "message": expert_text,
            "tier": 3,
            "source": "openai",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[CHAT] Error generating expert response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="I'm sorry, I'm having trouble providing guidance right now. Please try asking a more specific question.",
        )


@router.post("/set-api-key")
async def set_api_key(api_key: str = Body(..., alias="apiKey")):
    """Store API key."""
    global stored_api_key
    try:
        if not api_key:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="API key is required")
        stored_api_key = api_key
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to set API key")


@router.post("/test-api-key")
async def test_api_key(api_key: str | None = Body(None, alias="apiKey")):
    """Test API key."""
    global stored_api_key
    try:
        test_key = api_key or stored_api_key
        if not test_key:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No API key provided")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {test_key}",
                },
                json={
                    "model": "gpt-4o",
                    "messages": [{"role": "user", "content": "Hello, this is a test."}],
                    "max_tokens": 10,
                },
                timeout=30.0,
            )

            if response.status_code == 200:
                return {"success": True, "message": "API key validated successfully"}
            else:
                return {"success": False, "message": "Failed to validate API key. Please check and try again."}
    except Exception as e:
        logger.error(f"[CHAT] API key test failed: {e}")
        return {"success": False, "message": "Failed to validate API key. Please check and try again."}
