"""
WebSocket TTS Service
Handles real-time text-to-speech streaming using Socket.io and OpenAI TTS API
"""

import asyncio
import base64
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

import httpx
import socketio

from app.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class ConnectionInfo:
    """Connection information for a client."""
    sid: str
    is_streaming: bool = False
    connected_at: datetime = field(default_factory=datetime.utcnow)


class WebSocketTTSService:
    """WebSocket TTS Service for real-time text-to-speech streaming."""

    def __init__(self, cors_origins: list[str] | None = None):
        self.settings = get_settings()
        self.connections: dict[str, ConnectionInfo] = {}

        # Initialize Socket.io async server
        self.sio = socketio.AsyncServer(
            async_mode="asgi",
            cors_allowed_origins=cors_origins or ["*"],
            logger=False,
            engineio_logger=False,
        )

        self._setup_event_handlers()
        logger.info("[TTS Service] WebSocket TTS service initialized")
        logger.info(f"[TTS Service] CORS allowed origins: {cors_origins or ['*']}")

    def _setup_event_handlers(self) -> None:
        """Setup Socket.io event handlers."""
        logger.info("[TTS Service] Setting up event handlers")

        @self.sio.event
        async def connect(sid: str, environ: dict[str, Any]) -> None:
            logger.info(f"[TTS Service] Client connected: {sid}")
            self.connections[sid] = ConnectionInfo(sid=sid)

            # Send connection confirmation
            logger.info(f"[TTS Service] Sending tts-connected event to {sid}")
            await self.sio.emit(
                "tts-connected",
                {"message": "TTS service ready", "socketId": sid},
                to=sid,
            )
            logger.info(f"[TTS Service] tts-connected event sent to {sid}")

        @self.sio.event
        async def disconnect(sid: str) -> None:
            logger.info(f"[TTS Service] Client disconnected: {sid}")
            self.connections.pop(sid, None)

        @self.sio.on("generate-speech")
        async def on_generate_speech(sid: str, data: dict[str, Any]) -> dict[str, Any]:
            try:
                await self._handle_speech_generation(sid, data)
                return {"success": True}
            except Exception as e:
                logger.error(f"[TTS Service] Error generating speech: {e}")
                await self.sio.emit(
                    "tts-error",
                    {"message": str(e)},
                    to=sid,
                )
                return {"success": False, "error": "Failed to generate speech"}

        @self.sio.on("stop-speech")
        async def on_stop_speech(sid: str) -> None:
            conn = self.connections.get(sid)
            if conn:
                conn.is_streaming = False
                logger.info(f"[TTS Service] Speech stopped for client: {sid}")

    async def _handle_speech_generation(self, sid: str, data: dict[str, Any]) -> None:
        """Handle speech generation request."""
        conn = self.connections.get(sid)
        if not conn:
            raise ValueError("Connection not found")

        # Prevent concurrent streaming for the same client
        if conn.is_streaming:
            logger.info(f"[TTS Service] Client {sid} is already streaming, ignoring request")
            return

        # Validate input
        text = data.get("text", "")
        if not text or not text.strip():
            raise ValueError("Text is required")

        if len(text) > 4000:
            raise ValueError("Text is too long (max 4000 characters)")

        conn.is_streaming = True

        try:
            voice = data.get("voice", "alloy")
            speed = data.get("speed", 1.0)

            logger.info(f"[TTS Service] Generating speech for client {sid}: \"{text[:50]}...\"")

            # Emit start event
            await self.sio.emit(
                "speech-start",
                {"text": text, "voice": voice},
                to=sid,
            )

            # Call OpenAI TTS API
            api_key = self.settings.openai_api_key
            if not api_key:
                raise ValueError("OpenAI API key not configured")

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/audio/speech",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "tts-1",  # Use tts-1 for lower latency, tts-1-hd for higher quality
                        "input": text,
                        "voice": voice,
                        "speed": speed,
                        "response_format": "mp3",
                    },
                    timeout=60.0,
                )

                if response.status_code != 200:
                    raise ValueError(f"OpenAI TTS API error: {response.status_code} - {response.text}")

                # Stream the audio data
                total_bytes = 0
                chunk_size = 16384  # 16KB chunks for optimal streaming

                async for chunk in response.aiter_bytes(chunk_size):
                    # Check if client stopped or disconnected
                    if not conn.is_streaming or sid not in self.connections:
                        logger.info(f"[TTS Service] Streaming interrupted for client {sid}")
                        break

                    total_bytes += len(chunk)

                    # Emit audio chunk
                    await self.sio.emit(
                        "audio-chunk",
                        {
                            "data": base64.b64encode(chunk).decode("utf-8"),
                            "index": total_bytes // chunk_size,
                        },
                        to=sid,
                    )

                    # Small delay to prevent overwhelming the client
                    await asyncio.sleep(0.005)

                # Emit end event
                await self.sio.emit(
                    "speech-end",
                    {
                        "totalBytes": total_bytes,
                        "duration": total_bytes / 16000,  # Approximate duration
                    },
                    to=sid,
                )

                logger.info(f"[TTS Service] Speech generation completed for client {sid} ({total_bytes} bytes)")

        except Exception as e:
            logger.error(f"[TTS Service] Error in speech generation: {e}")
            await self.sio.emit(
                "tts-error",
                {"message": str(e)},
                to=sid,
            )
        finally:
            conn.is_streaming = False

    def get_stats(self) -> dict[str, Any]:
        """Get service statistics."""
        return {
            "activeConnections": len(self.connections),
            "connections": [
                {
                    "socketId": sid,
                    "isStreaming": conn.is_streaming,
                    "connectedAt": conn.connected_at.isoformat(),
                }
                for sid, conn in self.connections.items()
            ],
        }

    def get_asgi_app(self) -> socketio.ASGIApp:
        """Get the ASGI app for mounting in FastAPI."""
        return socketio.ASGIApp(self.sio)

    async def shutdown(self) -> None:
        """Shutdown the service."""
        logger.info("[TTS Service] Shutting down...")
        self.connections.clear()


# Singleton instance (will be initialized in main.py)
tts_service: WebSocketTTSService | None = None


def get_tts_service() -> WebSocketTTSService | None:
    """Get the TTS service instance."""
    return tts_service


def init_tts_service(cors_origins: list[str] | None = None) -> WebSocketTTSService:
    """Initialize the TTS service."""
    global tts_service
    tts_service = WebSocketTTSService(cors_origins)
    return tts_service


def get_socket_app(fastapi_app: Any) -> socketio.ASGIApp:
    """
    Create a Socket.io ASGI app that wraps the FastAPI app.
    This allows Socket.io to handle /socket.io/ requests and pass
    everything else to FastAPI.
    """
    if tts_service is None:
        raise RuntimeError("TTS service not initialized. Call init_tts_service first.")
    return socketio.ASGIApp(tts_service.sio, other_asgi_app=fastapi_app)
