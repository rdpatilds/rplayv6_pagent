"""
Feedback Service
Business logic for feedback operations
"""

import logging
from typing import Any

from app.repositories.feedback_repository import feedback_repository
from app.models.feedback import FeedbackData, CreateFeedbackRequest, UpdateFeedbackRequest, NPSData

logger = logging.getLogger(__name__)


class FeedbackService:
    """Service for feedback operations."""

    async def get_feedback_by_id(self, feedback_id: str) -> FeedbackData | None:
        """Get feedback by ID."""
        try:
            return await feedback_repository.find_by_id(feedback_id)
        except Exception as e:
            logger.error(f"Error getting feedback by ID: {e}")
            raise

    async def get_feedback_by_simulation_id(self, simulation_id: str) -> list[FeedbackData]:
        """Get all feedback for a simulation."""
        try:
            return await feedback_repository.find_by_simulation_id(simulation_id)
        except Exception as e:
            logger.error(f"Error getting feedback by simulation ID: {e}")
            raise

    async def get_feedback_by_user_id(self, user_id: str) -> list[FeedbackData]:
        """Get all feedback for a user."""
        try:
            return await feedback_repository.find_by_user_id(user_id)
        except Exception as e:
            logger.error(f"Error getting feedback by user ID: {e}")
            raise

    async def create_feedback(self, feedback_data: CreateFeedbackRequest | dict[str, Any]) -> FeedbackData:
        """Create new feedback."""
        try:
            return await feedback_repository.create(feedback_data)
        except Exception as e:
            logger.error(f"Error creating feedback: {e}")
            raise

    async def update_feedback(
        self,
        feedback_id: str,
        feedback_data: UpdateFeedbackRequest | dict[str, Any],
    ) -> FeedbackData:
        """Update feedback."""
        try:
            return await feedback_repository.update(feedback_id, feedback_data)
        except Exception as e:
            logger.error(f"Error updating feedback: {e}")
            raise

    async def delete_feedback(self, feedback_id: str) -> None:
        """Delete feedback."""
        try:
            await feedback_repository.delete(feedback_id)
        except Exception as e:
            logger.error(f"Error deleting feedback: {e}")
            raise

    async def get_all_nps(self) -> list[NPSData]:
        """Get all NPS feedback."""
        try:
            return await feedback_repository.get_all_nps()
        except Exception as e:
            logger.error(f"Error getting all NPS: {e}")
            raise

    async def create_nps(self, nps_data: dict[str, Any]) -> NPSData:
        """Create NPS feedback."""
        try:
            return await feedback_repository.create_nps(nps_data)
        except Exception as e:
            logger.error(f"Error creating NPS feedback: {e}")
            raise

    async def get_nps_analytics(self) -> dict[str, Any]:
        """Get NPS analytics."""
        try:
            all_nps = await feedback_repository.get_all_nps()

            if not all_nps:
                return {
                    "totalResponses": 0,
                    "promoters": 0,
                    "passives": 0,
                    "detractors": 0,
                    "npsScore": 0,
                    "avgScore": 0,
                }

            promoters = sum(1 for nps in all_nps if nps.score >= 9)
            passives = sum(1 for nps in all_nps if 7 <= nps.score <= 8)
            detractors = sum(1 for nps in all_nps if nps.score <= 6)
            total = len(all_nps)

            nps_score = ((promoters - detractors) / total) * 100 if total > 0 else 0
            avg_score = sum(nps.score for nps in all_nps) / total if total > 0 else 0

            return {
                "totalResponses": total,
                "promoters": promoters,
                "passives": passives,
                "detractors": detractors,
                "npsScore": round(nps_score, 1),
                "avgScore": round(avg_score, 1),
            }
        except Exception as e:
            logger.error(f"Error getting NPS analytics: {e}")
            raise

    async def get_feedback_summary(self, simulation_id: str) -> dict[str, Any]:
        """Get feedback summary for a simulation."""
        try:
            feedback_list = await feedback_repository.find_by_simulation_id(simulation_id)

            if not feedback_list:
                return {
                    "simulationId": simulation_id,
                    "overallRating": 0,
                    "competencyRatings": {},
                    "comments": [],
                }

            # Calculate overall rating
            ratings = [f.rating for f in feedback_list if f.rating is not None]
            overall_rating = sum(ratings) / len(ratings) if ratings else 0

            # Group by competency
            competency_ratings: dict[str, list[int]] = {}
            comments: list[str] = []

            for feedback in feedback_list:
                if feedback.competency_id and feedback.rating is not None:
                    if feedback.competency_id not in competency_ratings:
                        competency_ratings[feedback.competency_id] = []
                    competency_ratings[feedback.competency_id].append(feedback.rating)
                if feedback.comments:
                    comments.append(feedback.comments)

            # Average competency ratings
            avg_competency_ratings = {
                comp_id: sum(ratings) / len(ratings)
                for comp_id, ratings in competency_ratings.items()
            }

            return {
                "simulationId": simulation_id,
                "overallRating": round(overall_rating, 1),
                "competencyRatings": avg_competency_ratings,
                "comments": comments,
            }
        except Exception as e:
            logger.error(f"Error getting feedback summary: {e}")
            raise


# Singleton instance
feedback_service = FeedbackService()
