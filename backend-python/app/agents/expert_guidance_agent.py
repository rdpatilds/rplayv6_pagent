"""
Expert Guidance Agent
Provides expert advice to advisors during simulations
"""

import json
import logging
from typing import Any

from azure.ai.agents.models import ToolDefinition, FunctionTool, FunctionToolDefinition, FunctionDefinition

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


EXPERT_GUIDANCE_INSTRUCTIONS = """You are an expert financial advisor trainer providing guidance to an advisor in a training simulation. Your role is to help advisors improve their skills and succeed in their client interactions.

GUIDANCE PRINCIPLES:
1. Be supportive and encouraging while being honest
2. Provide specific, actionable advice
3. Reference the actual conversation when giving suggestions
4. Consider the client's profile and personality when advising
5. Help advisors develop transferable skills

RESPONSE STYLE:
- Keep responses focused and practical
- Prioritize the most important advice first
- Suggest specific phrases or approaches when helpful
- Consider the difficulty level and adjust expectations accordingly

Use the available tools to:
- Get current objectives and progress
- Get simulation context including client information

Remember: You are helping the ADVISOR, not the client. Your goal is to improve their advisory skills."""


class ExpertGuidanceAgent(BaseAgent):
    """
    Agent that provides expert guidance to advisors during simulations.
    Acts as a supportive trainer offering actionable advice.
    """

    def __init__(self):
        super().__init__(
            name="expert-guidance",
            instructions=EXPERT_GUIDANCE_INSTRUCTIONS,
            model=None,
        )
        self._objectives: list[dict[str, Any]] = []
        self._simulation_context: dict[str, Any] = {}

    def get_tools(self) -> list[ToolDefinition]:
        """Get tool definitions for the expert guidance agent."""
        return [
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="get_objectives",
                    description="Get the current objectives and their progress in the simulation.",
                    parameters={
                        "type": "object",
                        "properties": {},
                        "required": [],
                    },
                ),
            ),
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="get_simulation_context",
                    description="Get the simulation context including client profile, industry, and difficulty.",
                    parameters={
                        "type": "object",
                        "properties": {},
                        "required": [],
                    },
                ),
            ),
        ]

    async def handle_tool_call(self, tool_name: str, arguments: dict[str, Any]) -> str:
        """Handle tool calls from the agent."""
        context = getattr(self, "_current_context", {})

        if tool_name == "get_objectives":
            objectives = context.get("objectives", self._objectives)
            if not objectives:
                objectives = [
                    {"name": "Building Rapport", "progress": 0},
                    {"name": "Needs Assessment", "progress": 0},
                    {"name": "Handling Objections", "progress": 0},
                    {"name": "Providing Recommendations", "progress": 0},
                ]
            return json.dumps({
                "objectives": objectives,
                "overall_progress": sum(o.get("progress", 0) for o in objectives) / max(len(objectives), 1),
            })

        elif tool_name == "get_simulation_context":
            sim_context = context.get("simulation_settings", self._simulation_context)
            client_profile = context.get("client_profile", {})
            return json.dumps({
                "industry": sim_context.get("industry", "Unknown"),
                "subcategory": sim_context.get("subcategory"),
                "difficulty": sim_context.get("difficulty", "Unknown"),
                "competencies": sim_context.get("competencies", []),
                "client": {
                    "name": client_profile.get("name", "Unknown"),
                    "occupation": client_profile.get("occupation", "Unknown"),
                    "goals": client_profile.get("goals", []),
                    "concerns": client_profile.get("concerns", []),
                },
            })

        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    async def generate_guidance(
        self,
        messages: list[dict[str, Any]],
        client_profile: dict[str, Any],
        simulation_settings: dict[str, Any] | None = None,
        objectives: list[dict[str, Any]] | None = None,
        session_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate expert guidance for the advisor.

        Args:
            messages: Conversation history
            client_profile: Client profile data
            simulation_settings: Simulation settings
            objectives: Current objectives and progress
            session_id: Optional session ID for thread management

        Returns:
            Guidance response dictionary
        """
        if not self.is_initialized:
            raise RuntimeError("ExpertGuidanceAgent not initialized")

        self._objectives = objectives or []
        self._simulation_context = simulation_settings or {}

        context = {
            "client_profile": client_profile,
            "simulation_settings": simulation_settings or {},
            "objectives": objectives or [],
        }

        # Build context for the prompt
        guidance_context = self._build_guidance_context(
            client_profile,
            simulation_settings or {},
            objectives,
        )

        # Format conversation
        conversation_text = self._format_conversation(messages)

        prompt = f"""{guidance_context}

Recent conversation:
{conversation_text}

The advisor has asked for your guidance. Provide clear, practical, and supportive advice to help them succeed in this simulation.

Consider:
1. What's going well in the conversation?
2. What could be improved?
3. What specific strategies might help with this client?
4. What should be the advisor's next focus?

Provide actionable guidance that helps the advisor improve."""

        # Get or create thread for this session
        thread_id = await self.get_or_create_thread(session_id or "expert-default")

        response_text = await self.send_message(thread_id, prompt, context)

        return {
            "message": response_text,
            "tier": 3,  # Expert tier
            "source": "azure-agent",
            "agent_id": self.agent_id,
        }

    def _build_guidance_context(
        self,
        client_profile: dict[str, Any],
        simulation_settings: dict[str, Any],
        objectives: list[dict[str, Any]] | None,
    ) -> str:
        """Build context for guidance prompt."""
        competencies = simulation_settings.get("competencies", [])
        competencies_text = ", ".join(competencies) if competencies else "None specified"

        objectives_text = "\n".join([
            f"- {obj.get('name', '')}: {obj.get('progress', 0)}% complete"
            for obj in (objectives or [])
        ]) if objectives else "No objectives data available"

        return f"""Simulation Context:

Client Profile:
- Name: {client_profile.get('name', 'Unknown')}
- Age: {client_profile.get('age', 'Unknown')}
- Occupation: {client_profile.get('occupation', 'Unknown')}
- Goals: {', '.join(client_profile.get('goals', [])) if client_profile.get('goals') else 'Unknown'}
- Concerns: {', '.join(client_profile.get('concerns', [])) if client_profile.get('concerns') else 'Unknown'}

Industry: {simulation_settings.get('industry', 'Unknown')}{f" - {simulation_settings.get('subcategory')}" if simulation_settings.get('subcategory') else ''}
Difficulty Level: {simulation_settings.get('difficulty', 'Unknown')}

Competencies Being Evaluated: {competencies_text}

Current Objectives Progress:
{objectives_text}"""

    def _format_conversation(self, messages: list[dict[str, Any]]) -> str:
        """Format conversation for the prompt."""
        formatted = []
        # Take last N messages to keep context manageable
        recent_messages = messages[-10:] if len(messages) > 10 else messages

        for msg in recent_messages:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            if role == "system":
                continue
            label = "Advisor" if role == "user" else "Client"
            formatted.append(f"{label}: {content}")

        if len(messages) > 10:
            formatted.insert(0, f"[... {len(messages) - 10} earlier messages omitted ...]")

        return "\n".join(formatted) if formatted else "(No conversation yet)"
