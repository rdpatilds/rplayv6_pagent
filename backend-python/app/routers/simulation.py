"""
Simulation Router
Simulation management endpoints
"""

import json
import logging
from typing import Annotated, Any

import httpx
from fastapi import APIRouter, HTTPException, status, Depends, Body

from app.config import get_settings
from app.services.simulation_service import simulation_service
from app.repositories.simulation_repository import simulation_repository
from app.middleware.auth import get_current_user, require_ownership_or_admin
from app.models.user import UserData
from app.utils.validation import validate_uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/simulation", tags=["Simulation"])


@router.get("")
async def get_user_simulations(
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Get user's simulation stats."""
    try:
        stats = await simulation_service.get_user_stats(user.id)
        return {"success": True, "simulations": stats}
    except Exception as e:
        logger.error(f"Get simulations error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_simulation(
    user: Annotated[UserData, Depends(get_current_user)],
    industry: str = Body(...),
    difficulty: str = Body(...),
    subcategory: str | None = Body(None),
    simulation_id: str | None = Body(None, alias="simulationId"),
    client_profile: dict[str, Any] | None = Body(None, alias="clientProfile"),
    objectives: list[str] | None = Body(None),
):
    """Start new simulation."""
    try:
        logger.info(f"[CREATE SIMULATION] Request: industry={industry}, subcategory={subcategory}, difficulty={difficulty}, simulation_id={simulation_id}")

        if not industry or not difficulty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: industry, difficulty",
            )

        simulation = await simulation_service.start_simulation({
            "user_id": user.id,
            "simulation_id": simulation_id,
            "industry": industry,
            "subcategory": subcategory,
            "difficulty_level": difficulty,
            "client_profile": client_profile,
            "objectives": objectives or [],
        })

        logger.info(f"[CREATE SIMULATION] Created: id={simulation.id}")

        return {"success": True, "data": simulation.model_dump()}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Start simulation error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{simulation_id}")
async def get_simulation(
    simulation_id: str,
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Get simulation by ID."""
    try:
        if not validate_uuid(simulation_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid simulation ID format")

        simulation = await simulation_service.get_simulation_with_details(simulation_id)
        if not simulation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")

        # Check ownership
        require_ownership_or_admin(user, simulation.user_id)

        return {"success": True, "simulation": simulation.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get simulation error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{simulation_id}")
async def update_simulation(
    simulation_id: str,
    user: Annotated[UserData, Depends(get_current_user)],
    conversation_history: list[dict[str, Any]] = Body(..., alias="conversationHistory"),
    objectives: list[str] | None = Body(None),
):
    """Update simulation (add conversation message)."""
    try:
        if not validate_uuid(simulation_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid simulation ID format")

        simulation = await simulation_service.get_simulation_by_id(simulation_id)
        if not simulation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")

        # Check ownership
        if simulation.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this simulation")

        updated = await simulation_service.update_conversation(simulation_id, conversation_history)

        return {"success": True, "simulation": updated.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update simulation error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{simulation_id}")
async def patch_simulation(
    simulation_id: str,
    user: Annotated[UserData, Depends(get_current_user)],
    conversation_history: list[dict[str, Any]] | None = Body(None, alias="conversation_history"),
    objectives_completed: list[str] | None = Body(None),
    total_xp: int | None = Body(None),
):
    """Update simulation (conversation, objectives, XP)."""
    try:
        logger.info(f"[UPDATE SIMULATION] ID: {simulation_id}")

        if not validate_uuid(simulation_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid simulation ID format")

        simulation = await simulation_service.get_simulation_by_id(simulation_id)
        if not simulation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")

        # Check ownership
        if simulation.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this simulation")

        # Update conversation history if provided
        if conversation_history is not None:
            await simulation_service.update_conversation(simulation_id, conversation_history)

        # Update objectives and XP if provided
        update_data = {}
        if objectives_completed is not None:
            update_data["objectives_completed"] = objectives_completed
        if total_xp is not None:
            update_data["total_xp"] = total_xp

        if update_data:
            await simulation_repository.update(simulation_id, update_data)

        logger.info("[UPDATE SIMULATION] Updated successfully")

        updated = await simulation_service.get_simulation_by_id(simulation_id)
        return {"success": True, "data": updated.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update simulation error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{simulation_id}")
async def delete_simulation(
    simulation_id: str,
    user: Annotated[UserData, Depends(get_current_user)],
):
    """Delete simulation."""
    try:
        if not validate_uuid(simulation_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid simulation ID format")

        simulation = await simulation_service.get_simulation_by_id(simulation_id)
        if not simulation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")

        # Check ownership
        require_ownership_or_admin(user, simulation.user_id)

        await simulation_service.delete_simulation(simulation_id)

        return {"success": True, "message": "Simulation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete simulation error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{simulation_id}/complete")
async def complete_simulation(
    simulation_id: str,
    user: Annotated[UserData, Depends(get_current_user)],
    total_xp: int = Body(0),
    performance_review: dict[str, Any] | None = Body(None),
    duration_seconds: int | None = Body(None),
):
    """Complete simulation."""
    try:
        if not validate_uuid(simulation_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid simulation ID format")

        simulation = await simulation_service.get_simulation_by_id(simulation_id)
        if not simulation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")

        # Check ownership
        if simulation.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to complete this simulation")

        logger.info(f"[COMPLETE SIMULATION] Data: total_xp={total_xp}, has_perf_review={performance_review is not None}")

        completed = await simulation_repository.complete(simulation_id, total_xp, performance_review)

        if duration_seconds:
            await simulation_repository.update(simulation_id, {"duration_seconds": duration_seconds})

        return {"success": True, "simulation": completed.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Complete simulation error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/generate-review")
async def generate_review(
    messages: list[dict[str, Any]] = Body(...),
    competencies: list[dict[str, Any]] | None = Body(None),
    difficulty_level: str | None = Body(None, alias="difficultyLevel"),
):
    """Generate performance review."""
    try:
        if not messages or not isinstance(messages, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required field: messages (must be an array)",
            )

        settings = get_settings()
        api_key = settings.openai_api_key
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key not configured",
            )

        # Create prompt for generating the review
        system_prompt = f"""You are an expert evaluator for financial advisor training simulations.
Analyze the conversation between the advisor (user) and the client (assistant) to generate a detailed performance review.

Difficulty Level: {difficulty_level or 'Not specified'}
Competencies Being Evaluated: {', '.join([c.get('name', '') for c in (competencies or [])]) or 'General performance'}

Provide a comprehensive assessment of the advisor's performance with:
1. An overall score (1-10)
2. Scores for each competency (1-10)
3. Specific strengths demonstrated
4. Areas for improvement
5. A summary of the performance

Be specific, constructive, and reference actual moments from the conversation."""

        competency_scores_template = ""
        if competencies:
            competency_scores_template = ",".join([
                f'{{"name": "{c.get("name", "")}", "score": <number 1-10>, "strengths": ["strength 1"], "improvements": ["improvement 1"], "expectation": "description"}}'
                for c in competencies
            ])

        user_prompt = f"""Review this conversation and provide a detailed performance assessment.

Conversation:
{chr(10).join([f'{"Advisor" if m.get("role") == "user" else "Client"}: {m.get("content", "")}' for m in messages])}

Generate a performance review with the following structure:
{{
  "overallScore": <number 1-10>,
  "competencyScores": [{competency_scores_template}],
  "generalStrengths": ["strength 1", "strength 2", "strength 3"],
  "generalImprovements": ["improvement 1", "improvement 2", "improvement 3"],
  "summary": "overall performance summary"
}}

IMPORTANT: Respond with ONLY the raw JSON object. Do NOT wrap it in markdown code blocks."""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                },
                timeout=60.0,
            )

            if response.status_code != 200:
                logger.error(f"OpenAI API error: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to generate review from AI",
                )

            data = response.json()
            review_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            if not review_text:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="No review generated",
                )

            # Parse the JSON response
            cleaned_text = review_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text.replace("```json", "").replace("```", "").strip()
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text.replace("```", "").strip()

            try:
                review_data = json.loads(cleaned_text)

                # Ensure competencyScores is properly formatted
                if "competencyScores" not in review_data or not isinstance(review_data["competencyScores"], list):
                    review_data["competencyScores"] = []

                # Ensure other arrays have defaults
                review_data.setdefault("generalStrengths", [])
                review_data.setdefault("generalImprovements", [])
                review_data.setdefault("overallScore", 5)
                review_data.setdefault("summary", "")

                return {"success": True, "data": review_data}
            except json.JSONDecodeError:
                logger.error(f"Failed to parse review JSON: {review_text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to parse review data",
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate review error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
