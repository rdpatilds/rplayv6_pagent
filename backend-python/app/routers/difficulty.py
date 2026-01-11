"""
Difficulty Router
Difficulty levels endpoints
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/difficulty", tags=["Difficulty"])

# Hardcoded difficulty levels (matching the application's expected format)
DIFFICULTY_LEVELS = [
    {
        "id": "1",
        "key": "beginner",
        "label": "Beginner",
        "description": "Build foundational skills. All client details are provided upfront.",
        "display_order": 1,
    },
    {
        "id": "2",
        "key": "intermediate",
        "label": "Intermediate",
        "description": "Requires deeper trust-building with partially hidden information.",
        "display_order": 2,
    },
    {
        "id": "3",
        "key": "advanced",
        "label": "Advanced",
        "description": "Involves uncooperative or skeptical clients.",
        "display_order": 3,
    },
]


@router.get("")
async def get_difficulty_levels():
    """Get all difficulty levels."""
    return {"success": True, "data": {"levels": DIFFICULTY_LEVELS}}


@router.get("/{key}")
async def get_difficulty_level_by_key(key: str):
    """Get difficulty level by key."""
    level = next((l for l in DIFFICULTY_LEVELS if l["key"] == key), None)

    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Difficulty level not found",
        )

    return {"success": True, "data": {"level": level}}
