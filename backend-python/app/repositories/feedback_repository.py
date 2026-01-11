"""
Feedback Repository
Database operations for feedback and NPS entities
"""

import json
import logging
from typing import Any
from uuid import uuid4

from app.database import fetch, fetchone, execute, record_to_dict, records_to_list
from app.models.feedback import FeedbackData, CreateFeedbackRequest, UpdateFeedbackRequest, NPSData

logger = logging.getLogger(__name__)


class FeedbackRepository:
    """Repository for feedback database operations."""

    async def find_by_id(self, feedback_id: str) -> FeedbackData | None:
        """Find feedback by ID from nps_feedback table."""
        try:
            query = """
                SELECT id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
                FROM nps_feedback WHERE id = $1
            """
            record = await fetchone(query, feedback_id)
            if not record:
                return None
            data = record_to_dict(record)
            # Convert to FeedbackData format
            return FeedbackData(
                id=data["id"],
                simulation_id=data["simulation_id"],
                user_id=data["user_id"],
                competency_id=None,
                rating=data.get("score", 0) * 10,  # Convert 0-10 to 0-100
                comments=data.get("comments"),
                feedback_type=data["feedback_type"],
                metadata=None,
                created_at=data.get("submitted_at"),
                updated_at=data.get("submitted_at"),
            )
        except Exception as e:
            logger.error(f"Error finding feedback by ID: {e}")
            raise

    async def find_by_simulation_id(self, simulation_id: str) -> list[FeedbackData]:
        """Find all feedback for a simulation from nps_feedback table."""
        try:
            query = """
                SELECT id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
                FROM nps_feedback WHERE simulation_id = $1
                ORDER BY submitted_at DESC
            """
            records = await fetch(query, simulation_id)
            feedbacks = []
            for record in records:
                data = record_to_dict(record)
                feedbacks.append(FeedbackData(
                    id=data["id"],
                    simulation_id=data["simulation_id"],
                    user_id=data["user_id"],
                    competency_id=None,
                    rating=data.get("score", 0) * 10,
                    comments=data.get("comments"),
                    feedback_type=data["feedback_type"],
                    metadata=None,
                    created_at=data.get("submitted_at"),
                    updated_at=data.get("submitted_at"),
                ))
            return feedbacks
        except Exception as e:
            logger.error(f"Error finding feedback by simulation ID: {e}")
            raise

    async def find_by_user_id(self, user_id: str) -> list[FeedbackData]:
        """Find all feedback for a user from nps_feedback table."""
        try:
            query = """
                SELECT id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
                FROM nps_feedback WHERE user_id = $1
                ORDER BY submitted_at DESC
            """
            records = await fetch(query, user_id)
            feedbacks = []
            for record in records:
                data = record_to_dict(record)
                feedbacks.append(FeedbackData(
                    id=data["id"],
                    simulation_id=data["simulation_id"],
                    user_id=data["user_id"],
                    competency_id=None,
                    rating=data.get("score", 0) * 10,
                    comments=data.get("comments"),
                    feedback_type=data["feedback_type"],
                    metadata=None,
                    created_at=data.get("submitted_at"),
                    updated_at=data.get("submitted_at"),
                ))
            return feedbacks
        except Exception as e:
            logger.error(f"Error finding feedback by user ID: {e}")
            raise

    async def create(self, feedback_data: CreateFeedbackRequest | dict[str, Any]) -> FeedbackData:
        """Create new feedback in nps_feedback table."""
        try:
            if isinstance(feedback_data, CreateFeedbackRequest):
                data = feedback_data.model_dump()
            else:
                data = feedback_data

            # Convert rating (0-100) to score (0-10) for NPS
            rating = data.get("rating", 50)
            score = round(rating / 10) if rating else 5

            # Determine NPS feedback type based on score
            # 9-10 = promoter, 7-8 = passive, 0-6 = detractor
            if score >= 9:
                nps_feedback_type = "promoter"
            elif score >= 7:
                nps_feedback_type = "passive"
            else:
                nps_feedback_type = "detractor"

            logger.info(f"[FEEDBACK REPOSITORY] Creating NPS feedback: rating={rating}, score={score}, type={nps_feedback_type}")

            query = """
                INSERT INTO nps_feedback (simulation_id, user_id, score, feedback_type, comments)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
            """

            record = await fetchone(
                query,
                data["simulation_id"],
                data["user_id"],
                score,
                nps_feedback_type,
                data.get("comments"),
            )
            result_data = record_to_dict(record)

            # Convert to FeedbackData format (mapping nps_feedback fields)
            return FeedbackData(
                id=result_data["id"],
                simulation_id=result_data["simulation_id"],
                user_id=result_data["user_id"],
                competency_id=None,
                rating=score * 10,  # Convert back to 0-100 scale
                comments=result_data.get("comments"),
                feedback_type=result_data["feedback_type"],
                metadata=None,
                created_at=result_data.get("submitted_at"),
                updated_at=result_data.get("submitted_at"),
            )
        except Exception as e:
            logger.error(f"Error creating feedback: {e}")
            raise

    async def update(self, feedback_id: str, feedback_data: UpdateFeedbackRequest | dict[str, Any]) -> FeedbackData:
        """Update feedback."""
        try:
            if isinstance(feedback_data, UpdateFeedbackRequest):
                data = feedback_data.model_dump(exclude_unset=True)
            else:
                data = {k: v for k, v in feedback_data.items() if v is not None}

            # Build dynamic update query
            update_parts = []
            params = [feedback_id]
            param_idx = 2

            for key, value in data.items():
                if key == "metadata" and value and not isinstance(value, str):
                    value = json.dumps(value)
                update_parts.append(f"{key} = ${param_idx}")
                params.append(value)
                param_idx += 1

            if not update_parts:
                return await self.find_by_id(feedback_id)

            update_parts.append("updated_at = NOW()")
            query = f"""
                UPDATE feedback SET {', '.join(update_parts)}
                WHERE id = $1
                RETURNING id, simulation_id, user_id, competency_id, rating, comments, feedback_type, metadata, created_at, updated_at
            """
            record = await fetchone(query, *params)
            if not record:
                raise ValueError("Feedback not found")
            result_data = record_to_dict(record)
            if result_data.get("metadata") and isinstance(result_data["metadata"], str):
                try:
                    result_data["metadata"] = json.loads(result_data["metadata"])
                except json.JSONDecodeError:
                    pass
            return FeedbackData(**result_data)
        except Exception as e:
            logger.error(f"Error updating feedback: {e}")
            raise

    async def delete(self, feedback_id: str) -> None:
        """Delete feedback."""
        try:
            query = "DELETE FROM feedback WHERE id = $1"
            await execute(query, feedback_id)
        except Exception as e:
            logger.error(f"Error deleting feedback: {e}")
            raise

    async def delete_by_simulation_id(self, simulation_id: str) -> None:
        """Delete all feedback for a simulation."""
        try:
            query = "DELETE FROM feedback WHERE simulation_id = $1"
            await execute(query, simulation_id)
        except Exception as e:
            logger.error(f"Error deleting feedback by simulation ID: {e}")
            raise

    async def get_all_nps(self) -> list[NPSData]:
        """Get all NPS feedback."""
        try:
            query = """
                SELECT id, user_id, simulation_id, score, feedback_text, categories, follow_up_consent, submit_time_ms, created_at, updated_at
                FROM nps_feedback
                ORDER BY created_at DESC
            """
            records = await fetch(query)
            nps_list = []
            for record in records:
                data = dict(record)
                if data.get("categories") and isinstance(data["categories"], str):
                    try:
                        data["categories"] = json.loads(data["categories"])
                    except json.JSONDecodeError:
                        pass
                nps_list.append(NPSData(**data))
            return nps_list
        except Exception as e:
            logger.error(f"Error fetching all NPS: {e}")
            raise

    async def create_nps(self, nps_data: dict[str, Any]) -> NPSData:
        """Create NPS feedback."""
        try:
            nps_id = str(uuid4())
            query = """
                INSERT INTO nps_feedback (id, user_id, simulation_id, score, feedback_text, categories, follow_up_consent, submit_time_ms)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, user_id, simulation_id, score, feedback_text, categories, follow_up_consent, submit_time_ms, created_at, updated_at
            """
            categories = nps_data.get("categories")
            if categories and not isinstance(categories, str):
                categories = json.dumps(categories)

            record = await fetchone(
                query,
                nps_id,
                nps_data["user_id"],
                nps_data.get("simulation_id"),
                nps_data["score"],
                nps_data.get("feedback_text"),
                categories,
                nps_data.get("follow_up_consent", False),
                nps_data.get("submit_time_ms"),
            )
            result_data = record_to_dict(record)
            if result_data.get("categories") and isinstance(result_data["categories"], str):
                try:
                    result_data["categories"] = json.loads(result_data["categories"])
                except json.JSONDecodeError:
                    pass
            return NPSData(**result_data)
        except Exception as e:
            logger.error(f"Error creating NPS feedback: {e}")
            raise


# Singleton instance
feedback_repository = FeedbackRepository()
