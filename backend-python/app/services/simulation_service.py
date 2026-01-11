"""
Simulation Service
Business logic for simulation operations
"""

import logging
from datetime import datetime
from typing import Any

from app.repositories.simulation_repository import simulation_repository
from app.repositories.competency_repository import competency_repository
from app.repositories.file_rubric_repository import file_rubric_repository as rubric_repository
from app.repositories.feedback_repository import feedback_repository
from app.repositories.engagement_repository import engagement_repository
from app.models.simulation import (
    SimulationData,
    SimulationWithDetails,
    StartSimulationRequest,
)

logger = logging.getLogger(__name__)


class SimulationService:
    """Service for simulation operations."""

    VALID_INDUSTRIES = ["wealth-management", "banking", "insurance", "financial-planning"]
    DIFFICULTY_MAP = {
        "beginner": 1,
        "intermediate": 3,
        "advanced": 5,
    }

    async def get_simulation_by_id(self, simulation_id: str) -> SimulationData | None:
        """Get simulation by ID."""
        try:
            return await simulation_repository.find_by_id(simulation_id)
        except Exception as e:
            logger.error(f"Error getting simulation by ID: {e}")
            raise

    async def get_simulation_with_details(self, simulation_id: str) -> SimulationWithDetails | None:
        """Get simulation by ID with full details."""
        try:
            simulation = await simulation_repository.find_by_id(simulation_id)
            if not simulation:
                return None

            # Try to get associated competencies
            competencies = []
            try:
                competencies = await competency_repository.find_by_industry(simulation.industry)
                logger.info(f"[GET SIMULATION DETAILS] Found {len(competencies)} competencies for {simulation.industry}")
            except Exception as e:
                logger.warning(f"[GET SIMULATION DETAILS] Could not fetch competencies: {e}")

            # Try to get rubrics for this difficulty level
            rubrics = []
            try:
                difficulty_level = self.DIFFICULTY_MAP.get(simulation.difficulty, 1)
                rubrics = await rubric_repository.find_by_difficulty_level(difficulty_level)
                logger.info(f"[GET SIMULATION DETAILS] Found {len(rubrics)} rubrics for difficulty {difficulty_level}")
            except Exception as e:
                logger.warning(f"[GET SIMULATION DETAILS] Could not fetch rubrics: {e}")

            # Try to get feedback
            feedback = []
            try:
                feedback = await feedback_repository.find_by_simulation_id(simulation_id)
                logger.info(f"[GET SIMULATION DETAILS] Found {len(feedback)} feedback entries")
            except Exception as e:
                logger.warning(f"[GET SIMULATION DETAILS] Could not fetch feedback: {e}")

            return SimulationWithDetails(
                **simulation.model_dump(),
                competencies=[c.model_dump() for c in competencies],
                rubrics=[r.model_dump() for r in rubrics],
                feedback=[f.model_dump() for f in feedback],
            )
        except Exception as e:
            logger.error(f"Error getting simulation with details: {e}")
            raise

    async def get_user_simulations(self, user_id: str) -> list[SimulationData]:
        """Get simulations by user ID."""
        try:
            return await simulation_repository.find_by_user_id(user_id)
        except Exception as e:
            logger.error(f"Error getting user simulations: {e}")
            raise

    async def get_all_simulations(self, limit: int | None = None) -> list[SimulationData]:
        """Get all simulations."""
        try:
            return await simulation_repository.find_all(limit)
        except Exception as e:
            logger.error(f"Error getting all simulations: {e}")
            raise

    async def start_simulation(self, start_data: StartSimulationRequest | dict[str, Any]) -> SimulationData:
        """Start new simulation."""
        try:
            if isinstance(start_data, StartSimulationRequest):
                data = start_data.model_dump()
            else:
                data = start_data

            # Validate industry
            industry = data.get("industry")
            if not self._is_valid_industry(industry):
                raise ValueError("Invalid industry")

            # Convert difficulty_level to text if it's a number
            difficulty_level = data.get("difficulty_level")
            if isinstance(difficulty_level, int):
                difficulty = ["beginner", "intermediate", "advanced"][min(max(difficulty_level - 1, 0), 2)]
            else:
                difficulty = difficulty_level or "beginner"

            # Try to get competencies for this industry
            competencies = []
            try:
                competencies = await competency_repository.find_by_industry(industry)
                logger.info(f"[START SIMULATION] Found {len(competencies)} competencies for {industry}")
            except Exception as e:
                logger.warning(f"[START SIMULATION] Could not fetch competencies: {e}")

            # Generate objectives based on competencies
            objectives = self._generate_objectives(
                [c.model_dump() for c in competencies],
                self.DIFFICULTY_MAP.get(difficulty, 1),
            ) if competencies else []

            # Create simulation session
            simulation = await simulation_repository.create({
                "simulation_id": data.get("simulation_id") or data.get("simulationId"),
                "user_id": data.get("user_id") or data.get("userId"),
                "industry": industry,
                "subcategory": data.get("subcategory"),
                "difficulty": difficulty,
                "client_profile": data.get("client_profile") or data.get("clientProfile") or {},
                "objectives_completed": [],
            })

            logger.info(f"[START SIMULATION] Created simulation: {simulation.id}")

            # Track engagement event
            try:
                await engagement_repository.create({
                    "user_id": data.get("user_id") or data.get("userId"),
                    "simulation_id": simulation.id,
                    "event_type": "simulation_start",
                    "event_data": {
                        "industry": industry,
                        "difficulty": difficulty,
                    },
                })
            except Exception as e:
                logger.warning(f"[START SIMULATION] Could not track engagement event: {e}")

            return simulation
        except Exception as e:
            logger.error(f"Error starting simulation: {e}")
            raise

    async def update_conversation(
        self,
        simulation_id: str,
        conversation_history: list[dict[str, Any]],
    ) -> SimulationData:
        """Update simulation conversation history."""
        try:
            return await simulation_repository.update(simulation_id, {
                "conversation_history": conversation_history,
            })
        except Exception as e:
            logger.error(f"Error updating conversation: {e}")
            raise

    async def complete_simulation(
        self,
        simulation_id: str,
        score: int,
        review: dict[str, Any] | None = None,
    ) -> SimulationData:
        """Complete simulation."""
        try:
            simulation = await simulation_repository.find_by_id(simulation_id)
            if not simulation:
                raise ValueError("Simulation not found")

            if simulation.completed_at:
                raise ValueError("Simulation already completed")

            # Complete simulation
            completed_simulation = await simulation_repository.complete(simulation_id, score, review)

            # Track engagement event
            try:
                duration = self._calculate_duration(simulation.started_at, datetime.utcnow())
                await engagement_repository.create({
                    "user_id": simulation.user_id,
                    "simulation_id": simulation_id,
                    "event_type": "simulation_complete",
                    "event_data": {
                        "score": score,
                        "duration": duration,
                    },
                })
            except Exception as e:
                logger.warning(f"[COMPLETE SIMULATION] Could not track engagement event: {e}")

            return completed_simulation
        except Exception as e:
            logger.error(f"Error completing simulation: {e}")
            raise

    async def calculate_score(self, simulation_id: str) -> dict[str, Any]:
        """Calculate simulation score."""
        try:
            simulation = await simulation_repository.find_by_id(simulation_id)
            if not simulation:
                raise ValueError("Simulation not found")

            # Try to get feedback
            feedback = []
            try:
                feedback = await feedback_repository.find_by_simulation_id(simulation_id)
            except Exception as e:
                logger.warning(f"[CALCULATE SCORE] Could not fetch feedback: {e}")

            # Try to get competencies
            competencies = []
            try:
                competencies = await competency_repository.find_by_industry(simulation.industry)
            except Exception as e:
                logger.warning(f"[CALCULATE SCORE] Could not fetch competencies: {e}")

            # Calculate scores by competency
            by_competency: dict[str, float] = {}
            breakdown: list[dict[str, Any]] = []

            for competency in competencies:
                competency_feedback = [
                    f for f in feedback
                    if f.competency_id == competency.id
                ]

                avg_rating = (
                    sum(f.rating or 0 for f in competency_feedback) / len(competency_feedback)
                    if competency_feedback else 0
                )

                by_competency[competency.name] = avg_rating
                breakdown.append({
                    "competency": competency.name,
                    "score": avg_rating,
                    "feedback": " ".join(f.comments or "" for f in competency_feedback),
                })

            # Calculate overall score
            overall = (
                sum(by_competency.values()) / len(by_competency)
                if by_competency else 0
            )

            return {
                "overall": overall,
                "byCompetency": by_competency,
                "breakdown": breakdown,
            }
        except Exception as e:
            logger.error(f"Error calculating score: {e}")
            raise

    async def delete_simulation(self, simulation_id: str) -> None:
        """Delete simulation."""
        try:
            # Check if simulation exists
            simulation = await simulation_repository.find_by_id(simulation_id)
            if not simulation:
                raise ValueError("Simulation not found")

            # Delete associated feedback
            await feedback_repository.delete_by_simulation_id(simulation_id)

            # Delete associated engagement events
            await engagement_repository.delete_by_simulation_id(simulation_id)

            # Delete simulation
            await simulation_repository.delete(simulation_id)
        except Exception as e:
            logger.error(f"Error deleting simulation: {e}")
            raise

    async def get_user_stats(self, user_id: str) -> dict[str, Any]:
        """Get user statistics."""
        try:
            return await simulation_repository.get_user_stats(user_id)
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            raise

    def _is_valid_industry(self, industry: str) -> bool:
        """Validate industry."""
        return industry in self.VALID_INDUSTRIES

    def _generate_objectives(self, competencies: list[dict[str, Any]], difficulty_level: int) -> list[str]:
        """Generate objectives based on competencies."""
        return [f"Demonstrate {c.get('name', '')}" for c in competencies[:3]]

    def _calculate_duration(self, start: datetime | None, end: datetime) -> int:
        """Calculate duration in minutes."""
        if not start:
            return 0
        return int((end - start).total_seconds() / 60)


# Singleton instance
simulation_service = SimulationService()
