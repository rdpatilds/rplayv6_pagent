"""
File Storage Utility
Handles reading and writing JSON files safely
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Shared data directory path (relative to backend-python root)
SHARED_DATA_DIR = Path(__file__).parent.parent.parent.parent / "shared" / "data"

logger.info(f"[FILE STORAGE] Data directory: {SHARED_DATA_DIR}")


def get_data_dir() -> Path:
    """Get data directory path."""
    return SHARED_DATA_DIR


def read_json_file(filename: str) -> Any:
    """
    Read JSON file from shared data directory.

    Args:
        filename: Name of the JSON file

    Returns:
        Parsed JSON content
    """
    try:
        file_path = SHARED_DATA_DIR / filename

        if not file_path.exists():
            logger.warning(f"[FILE STORAGE] File not found: {file_path}, returning empty object/array")
            # Return empty array or object based on filename convention
            if "competencies" in filename or "rubrics" in filename:
                return []
            return {}

        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"[FILE STORAGE] Error reading {filename}: {e}")
        raise


def write_json_file(filename: str, data: Any) -> None:
    """
    Write JSON file atomically (write to temp file, then rename).

    Args:
        filename: Name of the JSON file
        data: Data to write
    """
    try:
        file_path = SHARED_DATA_DIR / filename
        temp_path = file_path.with_suffix(".tmp")

        # Ensure directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Write to temp file
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        # Atomic rename
        temp_path.replace(file_path)

        logger.info(f"[FILE STORAGE] Successfully wrote {filename}")
    except Exception as e:
        logger.error(f"[FILE STORAGE] Error writing {filename}: {e}")
        raise


def file_exists(filename: str) -> bool:
    """
    Check if file exists in data directory.

    Args:
        filename: Name of the file

    Returns:
        True if file exists
    """
    file_path = SHARED_DATA_DIR / filename
    return file_path.exists()
