"""
Profile Generation Agent
Generates realistic client profiles for simulations
"""

import json
import logging
from typing import Any

from azure.ai.agents.models import ToolDefinition, FunctionTool, FunctionToolDefinition, FunctionDefinition

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


PROFILE_GENERATION_INSTRUCTIONS = """You are a profile generator for financial advisory training simulations. Your role is to create diverse, realistic client personas that challenge advisors at various skill levels.

GUIDELINES:
1. Generate profiles that are realistic and relatable
2. Include varied backgrounds, financial situations, and goals
3. Consider the industry context for relevant concerns
4. Match complexity to the specified difficulty level
5. Create profiles that offer learning opportunities for advisors

DIFFICULTY LEVELS:
- Beginner: Simple, straightforward situations with clear needs
- Intermediate: More complex situations with multiple goals and some concerns
- Advanced: Complex situations with conflicting needs, objections, and nuanced concerns

Use the available tools to:
- Get industry-specific settings for relevant context
- Get difficulty settings for appropriate complexity
- Validate the generated profile structure

Always return profiles as valid JSON with consistent structure."""


PROFILE_SCHEMA = {
    "name": "string",
    "age": "number",
    "occupation": "string",
    "income": "string",
    "family": "string",
    "goals": ["string"],
    "concerns": ["string"],
    "background": "string",
    "personality_traits": ["string"],
    "communication_style": "string",
}


class ProfileGenerationAgent(BaseAgent):
    """
    Agent that generates realistic client profiles for simulations.
    Creates diverse personas with appropriate complexity for each difficulty level.
    """

    def __init__(self):
        super().__init__(
            name="profile-generation",
            instructions=PROFILE_GENERATION_INSTRUCTIONS,
            model=None,
        )
        self._industry_settings: dict[str, Any] = {}
        self._difficulty_settings: dict[str, Any] = {}

    def get_tools(self) -> list[ToolDefinition]:
        """Get tool definitions for the profile generation agent."""
        return [
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="get_industry_settings",
                    description="Get industry-specific settings including common concerns, goals, and terminology.",
                    parameters={
                        "type": "object",
                        "properties": {
                            "industry": {
                                "type": "string",
                                "description": "The industry to get settings for",
                            },
                        },
                        "required": ["industry"],
                    },
                ),
            ),
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="get_difficulty_settings",
                    description="Get difficulty level parameters including complexity requirements.",
                    parameters={
                        "type": "object",
                        "properties": {
                            "level": {
                                "type": "string",
                                "description": "Difficulty level (beginner, intermediate, advanced)",
                            },
                        },
                        "required": ["level"],
                    },
                ),
            ),
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="validate_profile",
                    description="Validate that a generated profile has all required fields.",
                    parameters={
                        "type": "object",
                        "properties": {
                            "profile": {
                                "type": "object",
                                "description": "The profile object to validate",
                            },
                        },
                        "required": ["profile"],
                    },
                ),
            ),
        ]

    async def handle_tool_call(self, tool_name: str, arguments: dict[str, Any]) -> str:
        """Handle tool calls from the agent."""
        context = getattr(self, "_current_context", {})

        if tool_name == "get_industry_settings":
            industry = arguments.get("industry", "").lower()
            settings = self._get_industry_config(industry)
            return json.dumps(settings)

        elif tool_name == "get_difficulty_settings":
            level = arguments.get("level", "beginner").lower()
            settings = self._get_difficulty_config(level)
            return json.dumps(settings)

        elif tool_name == "validate_profile":
            profile = arguments.get("profile", {})
            validation = self._validate_profile(profile)
            return json.dumps(validation)

        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    def _get_industry_config(self, industry: str) -> dict[str, Any]:
        """Get industry-specific configuration."""
        configs = {
            "financial services": {
                "common_goals": [
                    "retirement planning",
                    "investment growth",
                    "debt management",
                    "college savings",
                    "estate planning",
                ],
                "common_concerns": [
                    "market volatility",
                    "inflation",
                    "tax efficiency",
                    "risk tolerance",
                    "liquidity needs",
                ],
                "terminology": ["portfolio", "diversification", "asset allocation", "ROI", "compound interest"],
            },
            "insurance": {
                "common_goals": [
                    "life protection",
                    "income replacement",
                    "health coverage",
                    "property protection",
                ],
                "common_concerns": [
                    "premium costs",
                    "coverage gaps",
                    "claims process",
                    "policy terms",
                ],
                "terminology": ["premium", "deductible", "coverage limits", "beneficiary", "underwriting"],
            },
            "real estate": {
                "common_goals": [
                    "home purchase",
                    "investment properties",
                    "downsizing",
                    "rental income",
                ],
                "common_concerns": [
                    "market conditions",
                    "financing options",
                    "property values",
                    "location factors",
                ],
                "terminology": ["mortgage", "equity", "closing costs", "appraisal", "escrow"],
            },
        }
        return configs.get(industry, {
            "common_goals": ["financial security", "growth", "protection"],
            "common_concerns": ["costs", "risks", "complexity"],
            "terminology": [],
        })

    def _get_difficulty_config(self, level: str) -> dict[str, Any]:
        """Get difficulty-specific configuration."""
        configs = {
            "beginner": {
                "complexity": "low",
                "num_goals": "1-2",
                "num_concerns": "1-2",
                "objection_level": "minimal",
                "information_sharing": "open",
                "decision_style": "straightforward",
            },
            "intermediate": {
                "complexity": "medium",
                "num_goals": "2-3",
                "num_concerns": "2-3",
                "objection_level": "moderate",
                "information_sharing": "gradual",
                "decision_style": "considered",
            },
            "advanced": {
                "complexity": "high",
                "num_goals": "3-5",
                "num_concerns": "3-5",
                "objection_level": "high",
                "information_sharing": "guarded",
                "decision_style": "skeptical",
            },
        }
        return configs.get(level, configs["beginner"])

    def _validate_profile(self, profile: dict[str, Any]) -> dict[str, Any]:
        """Validate profile structure."""
        required_fields = ["name", "age", "occupation", "goals"]
        missing = [f for f in required_fields if f not in profile or not profile[f]]

        return {
            "valid": len(missing) == 0,
            "missing_fields": missing,
            "has_all_recommended": all(
                f in profile for f in ["income", "family", "concerns", "background"]
            ),
        }

    async def generate_profile(
        self,
        industry: str,
        difficulty: str,
        parameters: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Generate a client profile.

        Args:
            industry: Industry context
            difficulty: Difficulty level
            parameters: Optional additional parameters

        Returns:
            Generated profile dictionary
        """
        if not self.is_initialized:
            raise RuntimeError("ProfileGenerationAgent not initialized")

        context = {
            "industry": industry,
            "difficulty": difficulty,
            "parameters": parameters or {},
        }

        difficulty_string = (
            difficulty if isinstance(difficulty, str)
            else ("beginner" if difficulty <= 1 else "intermediate" if difficulty <= 2 else "advanced")
        )

        prompt = f"""Generate a realistic client profile for a {industry} simulation at {difficulty_string} difficulty level.

The profile must include:
- Name (realistic first and last name)
- Age (appropriate for financial planning needs)
- Occupation (realistic job title)
- Income range
- Family status
- 2-4 specific financial goals
- 2-3 concerns or hesitations
- Brief background context
- 2-3 personality traits
- Communication style preference

Return ONLY a valid JSON object with this structure:
{{
  "name": "Full Name",
  "age": 45,
  "occupation": "Job Title",
  "income": "$X - $Y annually",
  "family": "Married with 2 children",
  "goals": ["goal1", "goal2"],
  "concerns": ["concern1", "concern2"],
  "background": "Brief background...",
  "personality_traits": ["trait1", "trait2"],
  "communication_style": "direct/analytical/emotional/etc."
}}"""

        thread_id = await self.create_thread()
        response_text = await self.send_message(thread_id, prompt, context)

        # Parse JSON response
        try:
            # Clean potential markdown wrapping
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned.replace("```json", "").replace("```", "").strip()
            elif cleaned.startswith("```"):
                cleaned = cleaned.replace("```", "").strip()

            profile = json.loads(cleaned)
            profile["source"] = "azure-agent"
            return profile
        except json.JSONDecodeError as e:
            logger.error(f"[ProfileGenerationAgent] Failed to parse profile JSON: {e}")
            # Return a basic profile
            return {
                "name": "Generated Client",
                "age": 40,
                "occupation": "Professional",
                "income": "$75,000 - $100,000",
                "family": "Not specified",
                "goals": ["Financial planning"],
                "concerns": ["General financial concerns"],
                "background": response_text[:200] if response_text else "",
                "personality_traits": ["practical"],
                "communication_style": "direct",
                "source": "azure-agent",
                "parse_error": True,
            }

    async def generate_conversation_starter(
        self,
        client_profile: dict[str, Any],
    ) -> str:
        """
        Generate a conversation starter for a client.

        Args:
            client_profile: Client profile data

        Returns:
            Opening message from the client
        """
        if not self.is_initialized:
            raise RuntimeError("ProfileGenerationAgent not initialized")

        context = {"client_profile": client_profile}

        prompt = f"""Given this client profile, generate a realistic opening message from the client starting the conversation with their financial advisor.

Client Profile:
{json.dumps(client_profile, indent=2)}

The message should:
- Be natural and conversational
- Reflect the client's personality and communication style
- Hint at their primary concern or goal
- Be appropriate as a first message in the meeting

Return ONLY the client's opening message, no quotes or prefixes."""

        thread_id = await self.create_thread()
        response_text = await self.send_message(thread_id, prompt, context)

        # Clean up response
        response_text = response_text.strip().strip('"').strip("'")
        if not response_text:
            response_text = "Hello, I'm here to discuss my financial situation. I've been thinking about my future and wanted to get some professional advice."

        return response_text
