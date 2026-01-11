"""
Simulation Client Agent
Simulates client personas in training conversations
"""

import json
import logging
from typing import Any

from azure.ai.agents.models import ToolDefinition, FunctionTool, FunctionToolDefinition, FunctionDefinition

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


SIMULATION_CLIENT_INSTRUCTIONS = """You are an AI client in a training simulation. Your role is to behave as a realistic client with the personality traits, background, and needs specified in your profile.

IMPORTANT GUIDELINES:
1. You are the CLIENT, not the advisor. Respond as if you are seeking financial advice.
2. Stay in character throughout the conversation.
3. Respond naturally and conversationally, avoiding robotic language.
4. Never reference that you are an AI or break character.
5. Use the available tools to:
   - Get your client profile details when needed
   - Understand your emotional state for appropriate responses
   - Track conversation objectives progress

DIFFICULTY BEHAVIORS:
- Beginner: Be friendly, cooperative, and open. Provide information readily.
- Intermediate: Be somewhat reserved. Only reveal details when asked specifically or when trust is established.
- Advanced: Be skeptical and challenging. Question recommendations and raise objections.

For your first response, introduce yourself briefly with just your name and a general reason for meeting with the advisor."""


def get_difficulty_guidelines(difficulty: str) -> str:
    """Get difficulty-specific guidelines."""
    difficulty_lower = difficulty.lower()
    if difficulty_lower == "beginner":
        return "Be friendly, cooperative, and open. Provide information readily when asked."
    elif difficulty_lower == "intermediate":
        return "Be somewhat reserved. Only reveal details when asked specifically or when trust is established."
    elif difficulty_lower == "advanced":
        return "Be skeptical, challenging, and resistant. Question recommendations and raise objections."
    return "Be friendly and cooperative, with a balanced approach."


class SimulationClientAgent(BaseAgent):
    """
    Agent that simulates client personas in training conversations.
    Used for generating realistic client responses in advisor simulations.
    """

    def __init__(self):
        super().__init__(
            name="simulation-client",
            instructions=SIMULATION_CLIENT_INSTRUCTIONS,
            model=None,  # Use default model from settings
        )
        self._client_profile: dict[str, Any] = {}
        self._personality_settings: dict[str, Any] = {}
        self._simulation_settings: dict[str, Any] = {}

    def get_tools(self) -> list[ToolDefinition]:
        """Get tool definitions for the simulation client agent."""
        return [
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="get_client_profile",
                    description="Get the current client profile including name, age, occupation, income, goals, and background.",
                    parameters={
                        "type": "object",
                        "properties": {},
                        "required": [],
                    },
                ),
            ),
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="get_emotional_state",
                    description="Get the client's current emotional state and mood for appropriate response tone.",
                    parameters={
                        "type": "object",
                        "properties": {},
                        "required": [],
                    },
                ),
            ),
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="track_objectives",
                    description="Track and evaluate progress on conversation objectives like rapport building and needs assessment.",
                    parameters={
                        "type": "object",
                        "properties": {
                            "rapport_progress": {
                                "type": "number",
                                "description": "Progress on building rapport (0-100)",
                            },
                            "needs_progress": {
                                "type": "number",
                                "description": "Progress on needs assessment (0-100)",
                            },
                            "observation": {
                                "type": "string",
                                "description": "Brief observation about advisor's approach",
                            },
                        },
                        "required": [],
                    },
                ),
            ),
        ]

    async def handle_tool_call(self, tool_name: str, arguments: dict[str, Any]) -> str:
        """Handle tool calls from the agent."""
        context = getattr(self, "_current_context", {})

        if tool_name == "get_client_profile":
            profile = context.get("client_profile", self._client_profile)
            return json.dumps({
                "name": profile.get("name", "Unknown Client"),
                "age": profile.get("age", "Unknown"),
                "occupation": profile.get("occupation", "Unknown"),
                "income": profile.get("income", "Unknown"),
                "family": profile.get("family", "Unknown"),
                "goals": profile.get("goals", []),
                "concerns": profile.get("concerns", []),
                "background": profile.get("background", ""),
            })

        elif tool_name == "get_emotional_state":
            personality = context.get("personality_settings", self._personality_settings)
            simulation = context.get("simulation_settings", self._simulation_settings)
            return json.dumps({
                "mood": personality.get("mood", "neutral"),
                "archetype": personality.get("archetype", "Standard Client"),
                "difficulty": simulation.get("difficulty", "beginner"),
                "traits": personality.get("traits", {}),
                "guidelines": get_difficulty_guidelines(simulation.get("difficulty", "beginner")),
            })

        elif tool_name == "track_objectives":
            # This is primarily for the agent to internally track, but we log it
            logger.debug(f"[SimulationClientAgent] Objectives tracked: {arguments}")
            return json.dumps({
                "status": "tracked",
                "rapport": arguments.get("rapport_progress", 0),
                "needs": arguments.get("needs_progress", 0),
            })

        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    async def generate_response(
        self,
        messages: list[dict[str, Any]],
        client_profile: dict[str, Any],
        personality_settings: dict[str, Any] | None = None,
        simulation_settings: dict[str, Any] | None = None,
        session_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate a client response for the simulation.

        Args:
            messages: Conversation history
            client_profile: Client profile data
            personality_settings: Optional personality settings
            simulation_settings: Optional simulation settings
            session_id: Optional session ID for thread management

        Returns:
            Response dictionary with message and metadata
        """
        if not self.is_initialized:
            raise RuntimeError("SimulationClientAgent not initialized")

        # Store context for tool calls
        self._client_profile = client_profile
        self._personality_settings = personality_settings or {}
        self._simulation_settings = simulation_settings or {}

        # Build context for tools
        context = {
            "client_profile": client_profile,
            "personality_settings": personality_settings or {},
            "simulation_settings": simulation_settings or {},
        }

        # Build enhanced prompt with profile context
        profile_context = self._build_profile_context(
            client_profile,
            personality_settings or {},
            simulation_settings or {},
        )

        # Get or create thread
        thread_id = await self.get_or_create_thread(session_id or "default")

        # Format conversation for agent
        conversation_text = self._format_conversation(messages)
        prompt = f"{profile_context}\n\nConversation so far:\n{conversation_text}\n\nRespond as the client:"

        # Send message and get response
        response_text = await self.send_message(thread_id, prompt, context)

        return {
            "message": response_text,
            "source": "azure-agent",
            "agent_id": self.agent_id,
        }

    def _build_profile_context(
        self,
        client_profile: dict[str, Any],
        personality_settings: dict[str, Any],
        simulation_settings: dict[str, Any],
    ) -> str:
        """Build profile context for the prompt."""
        difficulty = simulation_settings.get("difficulty", "beginner")
        guidelines = get_difficulty_guidelines(difficulty)

        return f"""Current Client Context:
- Name: {client_profile.get('name', 'Unknown')}
- Age: {client_profile.get('age', 'Unknown')}
- Occupation: {client_profile.get('occupation', 'Unknown')}
- Income: {client_profile.get('income', 'Unknown')}
- Family Status: {client_profile.get('family', 'Unknown')}
- Goals: {', '.join(client_profile.get('goals', [])) if client_profile.get('goals') else 'Not specified'}

Personality:
- Mood: {personality_settings.get('mood', 'neutral')}
- Archetype: {personality_settings.get('archetype', 'Standard Client')}

Industry: {simulation_settings.get('industry', 'Unknown')}{f" - {simulation_settings.get('subcategory')}" if simulation_settings.get('subcategory') else ''}
Difficulty: {difficulty}

Behavior Guidelines: {guidelines}"""

    def _format_conversation(self, messages: list[dict[str, Any]]) -> str:
        """Format conversation history for the prompt."""
        formatted = []
        for msg in messages:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            if role == "user":
                formatted.append(f"Advisor: {content}")
            elif role == "assistant":
                formatted.append(f"Client: {content}")
        return "\n".join(formatted) if formatted else "(Start of conversation)"
