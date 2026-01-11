"""
Simulation Repository
Database operations for simulation entities
"""

import json
import logging
from typing import Any
from uuid import uuid4

from app.database import fetch, fetchone, execute, record_to_dict, records_to_list
from app.models.simulation import SimulationData

logger = logging.getLogger(__name__)


class SimulationRepository:
    """Repository for simulation database operations."""

    async def find_by_id(self, id: str) -> SimulationData | None:
        """Find simulation by UUID."""
        try:
            query = """
                SELECT id, simulation_id, user_id, industry, subcategory, difficulty, client_profile,
                       conversation_history, objectives_completed, total_xp, performance_review,
                       started_at, completed_at, duration_seconds
                FROM simulations WHERE id = $1
            """
            record = await fetchone(query, id)
            if not record:
                return None
            data = record_to_dict(record)
            # Parse JSON fields
            for field in ["client_profile", "conversation_history", "objectives_completed", "performance_review"]:
                if data.get(field) and isinstance(data[field], str):
                    try:
                        data[field] = json.loads(data[field])
                    except json.JSONDecodeError:
                        pass
            return SimulationData(**data)
        except Exception as e:
            logger.error(f"Error finding simulation by ID: {e}")
            raise

    async def find_by_simulation_id(self, simulation_id: str) -> SimulationData | None:
        """Find simulation by simulation_id (text identifier like SIM-12345)."""
        try:
            query = """
                SELECT id, simulation_id, user_id, industry, subcategory, difficulty, client_profile,
                       conversation_history, objectives_completed, total_xp, performance_review,
                       started_at, completed_at, duration_seconds
                FROM simulations WHERE simulation_id = $1
            """
            record = await fetchone(query, simulation_id)
            if not record:
                return None
            data = record_to_dict(record)
            # Parse JSON fields
            for field in ["client_profile", "conversation_history", "objectives_completed", "performance_review"]:
                if data.get(field) and isinstance(data[field], str):
                    try:
                        data[field] = json.loads(data[field])
                    except json.JSONDecodeError:
                        pass
            return SimulationData(**data)
        except Exception as e:
            logger.error(f"Error finding simulation by simulation_id: {e}")
            raise

    async def find_by_user_id(self, user_id: str) -> list[SimulationData]:
        """Find all simulations for a user."""
        try:
            query = """
                SELECT id, simulation_id, user_id, industry, subcategory, difficulty, client_profile,
                       conversation_history, objectives_completed, total_xp, performance_review,
                       started_at, completed_at, duration_seconds
                FROM simulations WHERE user_id = $1
                ORDER BY started_at DESC
            """
            records = await fetch(query, user_id)
            simulations = []
            for record in records:
                data = record_to_dict(record)
                # Parse JSON fields
                for field in ["client_profile", "conversation_history", "objectives_completed", "performance_review"]:
                    if data.get(field) and isinstance(data[field], str):
                        try:
                            data[field] = json.loads(data[field])
                        except json.JSONDecodeError:
                            pass
                simulations.append(SimulationData(**data))
            return simulations
        except Exception as e:
            logger.error(f"Error finding simulations by user ID: {e}")
            raise

    async def find_all(self, limit: int | None = None) -> list[SimulationData]:
        """Get all simulations."""
        try:
            query = """
                SELECT id, simulation_id, user_id, industry, subcategory, difficulty, client_profile,
                       conversation_history, objectives_completed, total_xp, performance_review,
                       started_at, completed_at, duration_seconds
                FROM simulations
                ORDER BY started_at DESC
            """
            if limit:
                query += f" LIMIT {limit}"
            records = await fetch(query)
            simulations = []
            for record in records:
                data = record_to_dict(record)
                for field in ["client_profile", "conversation_history", "objectives_completed", "performance_review"]:
                    if data.get(field) and isinstance(data[field], str):
                        try:
                            data[field] = json.loads(data[field])
                        except json.JSONDecodeError:
                            pass
                simulations.append(SimulationData(**data))
            return simulations
        except Exception as e:
            logger.error(f"Error fetching all simulations: {e}")
            raise

    async def create(self, simulation_data: dict[str, Any]) -> SimulationData:
        """Create a new simulation."""
        try:
            # Generate simulation_id text identifier (e.g., SIM-12345678)
            import time
            sim_id_text = simulation_data.get("simulation_id") or f"SIM-{int(time.time() * 1000) % 100000000}"

            query = """
                INSERT INTO simulations (
                    simulation_id, user_id, industry, subcategory, difficulty, client_profile,
                    conversation_history, objectives_completed, started_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                RETURNING id, simulation_id, user_id, industry, subcategory, difficulty, client_profile,
                          conversation_history, objectives_completed, total_xp, performance_review,
                          started_at, completed_at, duration_seconds
            """
            record = await fetchone(
                query,
                sim_id_text,
                simulation_data["user_id"],
                simulation_data["industry"],
                simulation_data.get("subcategory"),
                simulation_data.get("difficulty", "beginner"),
                json.dumps(simulation_data.get("client_profile", {})),
                json.dumps(simulation_data.get("conversation_history", [])),
                json.dumps(simulation_data.get("objectives_completed", [])),
            )
            data = record_to_dict(record)
            for field in ["client_profile", "conversation_history", "objectives_completed", "performance_review"]:
                if data.get(field) and isinstance(data[field], str):
                    try:
                        data[field] = json.loads(data[field])
                    except json.JSONDecodeError:
                        pass
            return SimulationData(**data)
        except Exception as e:
            logger.error(f"Error creating simulation: {e}")
            raise

    async def update(self, simulation_id: str, update_data: dict[str, Any]) -> SimulationData:
        """Update a simulation."""
        try:
            # Build dynamic update query
            update_parts = []
            params = [simulation_id]
            param_idx = 2

            for key, value in update_data.items():
                if value is not None:
                    # Serialize JSON fields
                    if key in ["client_profile", "conversation_history", "objectives_completed", "performance_review"]:
                        value = json.dumps(value) if not isinstance(value, str) else value
                    update_parts.append(f"{key} = ${param_idx}")
                    params.append(value)
                    param_idx += 1

            if not update_parts:
                return await self.find_by_id(simulation_id)

            query = f"""
                UPDATE simulations SET {', '.join(update_parts)}
                WHERE id = $1
                RETURNING id, simulation_id, user_id, industry, subcategory, difficulty, client_profile,
                          conversation_history, objectives_completed, total_xp, performance_review,
                          started_at, completed_at, duration_seconds
            """
            record = await fetchone(query, *params)
            if not record:
                raise ValueError("Simulation not found")
            data = record_to_dict(record)
            for field in ["client_profile", "conversation_history", "objectives_completed", "performance_review"]:
                if data.get(field) and isinstance(data[field], str):
                    try:
                        data[field] = json.loads(data[field])
                    except json.JSONDecodeError:
                        pass
            return SimulationData(**data)
        except Exception as e:
            logger.error(f"Error updating simulation: {e}")
            raise

    async def complete(
        self,
        simulation_id: str,
        total_xp: int,
        performance_review: dict[str, Any] | None = None,
    ) -> SimulationData:
        """Mark simulation as complete."""
        try:
            query = """
                UPDATE simulations
                SET completed_at = NOW(), total_xp = $2, performance_review = $3
                WHERE id = $1
                RETURNING id, simulation_id, user_id, industry, subcategory, difficulty, client_profile,
                          conversation_history, objectives_completed, total_xp, performance_review,
                          started_at, completed_at, duration_seconds
            """
            record = await fetchone(
                query,
                simulation_id,
                total_xp,
                json.dumps(performance_review) if performance_review else None,
            )
            if not record:
                raise ValueError("Simulation not found")
            data = record_to_dict(record)
            for field in ["client_profile", "conversation_history", "objectives_completed", "performance_review"]:
                if data.get(field) and isinstance(data[field], str):
                    try:
                        data[field] = json.loads(data[field])
                    except json.JSONDecodeError:
                        pass
            return SimulationData(**data)
        except Exception as e:
            logger.error(f"Error completing simulation: {e}")
            raise

    async def delete(self, simulation_id: str) -> None:
        """Delete a simulation."""
        try:
            query = "DELETE FROM simulations WHERE id = $1"
            await execute(query, simulation_id)
        except Exception as e:
            logger.error(f"Error deleting simulation: {e}")
            raise

    async def get_user_stats(self, user_id: str) -> dict[str, Any]:
        """Get user simulation statistics."""
        try:
            query = """
                SELECT
                    COUNT(*) as total,
                    COUNT(completed_at) as completed,
                    COALESCE(AVG(total_xp), 0) as avg_score
                FROM simulations WHERE user_id = $1
            """
            record = await fetchone(query, user_id)
            if not record:
                return {"total": 0, "completed": 0, "avgScore": 0}
            return {
                "total": record["total"],
                "completed": record["completed"],
                "avgScore": float(record["avg_score"]) if record["avg_score"] else 0,
            }
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            raise


# Singleton instance
simulation_repository = SimulationRepository()
