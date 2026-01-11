"""
AI Service
Business logic for AI interactions
Supports Azure AI Agents with OpenAI fallback
"""

import json
import logging
from typing import Any

import httpx
from openai import AsyncOpenAI

from app.config import get_settings, is_openai_configured, is_azure_configured
from app.repositories.parameter_repository import parameter_repository
from app.models.chat import ChatMessage, AIResponse, ObjectiveProgress
from app.agents.agent_manager import agent_manager

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI interactions with Azure Agents and OpenAI fallback."""

    def __init__(self):
        settings = get_settings()

        if not is_openai_configured() and not is_azure_configured():
            logger.warning("Neither OPENAI_API_KEY nor AZURE_AI_PROJECT_ENDPOINT is set. AI features will not work.")
        elif not is_openai_configured():
            logger.warning("OPENAI_API_KEY not set. Fallback to OpenAI will not work.")

        self.openai = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.settings = settings

    def _should_use_azure(self) -> bool:
        """Check if Azure agents should be used."""
        return agent_manager.is_azure_available

    async def generate_client_response(
        self,
        conversation_history: list[ChatMessage | dict[str, Any]],
        client_profile: dict[str, Any],
        context_parameters: dict[str, Any] | None = None,
    ) -> AIResponse:
        """
        Generate AI client response for simulation.
        Uses Azure agents with OpenAI fallback.
        """
        # Try Azure agent first
        if self._should_use_azure():
            try:
                agent = agent_manager.get_simulation_client_agent()
                if agent and agent.is_initialized:
                    # Convert messages to dict format
                    messages = []
                    for msg in conversation_history:
                        if isinstance(msg, ChatMessage):
                            messages.append({"role": msg.role, "content": msg.content})
                        else:
                            messages.append(msg)

                    result = await agent.generate_response(
                        messages=messages,
                        client_profile=client_profile,
                        personality_settings=context_parameters.get("personality_settings") if context_parameters else None,
                        simulation_settings=context_parameters.get("simulation_settings") if context_parameters else None,
                    )

                    return AIResponse(
                        message=result.get("message", ""),
                        token_usage=None,
                        source="azure-agent",
                    )
            except Exception as e:
                logger.warning(f"Azure agent failed, falling back to OpenAI: {e}")

        # Fallback to OpenAI
        return await self._generate_client_response_openai(
            conversation_history,
            client_profile,
            context_parameters,
        )

    async def _generate_client_response_openai(
        self,
        conversation_history: list[ChatMessage | dict[str, Any]],
        client_profile: dict[str, Any],
        context_parameters: dict[str, Any] | None = None,
    ) -> AIResponse:
        """Generate client response using OpenAI."""
        try:
            parameters = await self._get_ai_parameters()
            system_prompt = self._build_system_prompt(client_profile, parameters)

            messages = [{"role": "system", "content": system_prompt}]
            for msg in conversation_history:
                if isinstance(msg, ChatMessage):
                    messages.append({"role": msg.role, "content": msg.content})
                else:
                    messages.append(msg)

            if not self.openai:
                raise ValueError("OpenAI client not configured")

            response = await self.openai.chat.completions.create(
                model=parameters.get("model", self.settings.openai_default_model),
                messages=messages,
                temperature=parameters.get("temperature", self.settings.openai_default_temperature),
                max_tokens=parameters.get("max_tokens", self.settings.openai_max_tokens),
                top_p=parameters.get("top_p", 1.0),
                frequency_penalty=parameters.get("frequency_penalty", 0.0),
                presence_penalty=parameters.get("presence_penalty", 0.0),
            )

            message_content = response.choices[0].message.content or ""
            token_usage = None
            if response.usage:
                token_usage = {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens,
                }

            return AIResponse(
                message=message_content,
                token_usage=token_usage,
                source="openai",
            )
        except Exception as e:
            logger.error(f"Error generating client response: {e}")
            raise

    async def generate_evaluation(
        self,
        conversation_history: list[ChatMessage | dict[str, Any]],
        competencies: list[dict[str, Any]],
        rubrics: list[dict[str, Any]],
        difficulty: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate evaluation/feedback.
        Uses Azure agents with OpenAI fallback.
        """
        # Try Azure agent first
        if self._should_use_azure():
            try:
                agent = agent_manager.get_evaluation_agent()
                if agent and agent.is_initialized:
                    messages = []
                    for msg in conversation_history:
                        if isinstance(msg, ChatMessage):
                            messages.append({"role": msg.role, "content": msg.content})
                        else:
                            messages.append(msg)

                    result = await agent.generate_review(
                        messages=messages,
                        competencies=competencies,
                        difficulty=difficulty,
                    )
                    return result
            except Exception as e:
                logger.warning(f"Azure agent failed, falling back to OpenAI: {e}")

        # Fallback to OpenAI
        return await self._generate_evaluation_openai(
            conversation_history,
            competencies,
            rubrics,
            difficulty,
        )

    async def _generate_evaluation_openai(
        self,
        conversation_history: list[ChatMessage | dict[str, Any]],
        competencies: list[dict[str, Any]],
        rubrics: list[dict[str, Any]],
        difficulty: str | None = None,
    ) -> dict[str, Any]:
        """Generate evaluation using OpenAI."""
        try:
            evaluation_prompt = self._build_evaluation_prompt(competencies, rubrics)

            messages = [
                {"role": "system", "content": evaluation_prompt},
                {"role": "user", "content": f"Please evaluate this conversation:\n\n{json.dumps(conversation_history)}"},
            ]

            if not self.openai:
                raise ValueError("OpenAI client not configured")

            response = await self.openai.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.3,
                max_tokens=1000,
            )

            evaluation_text = response.choices[0].message.content or ""

            return {
                **self._parse_evaluation(evaluation_text, competencies),
                "source": "openai",
            }
        except Exception as e:
            logger.error(f"Error generating evaluation: {e}")
            raise

    async def generate_client_profile(
        self,
        industry: str,
        difficulty_level: int | str,
        parameters: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Generate client profile.
        Uses Azure agents with OpenAI fallback.
        """
        difficulty_string = (
            difficulty_level if isinstance(difficulty_level, str)
            else ("beginner" if difficulty_level <= 1 else "intermediate" if difficulty_level <= 2 else "advanced")
        )

        # Try Azure agent first
        if self._should_use_azure():
            try:
                agent = agent_manager.get_profile_generation_agent()
                if agent and agent.is_initialized:
                    result = await agent.generate_profile(
                        industry=industry,
                        difficulty=difficulty_string,
                        parameters=parameters,
                    )
                    return result
            except Exception as e:
                logger.warning(f"Azure agent failed, falling back to OpenAI: {e}")

        # Fallback to OpenAI
        return await self._generate_client_profile_openai(industry, difficulty_string, parameters)

    async def _generate_client_profile_openai(
        self,
        industry: str,
        difficulty_string: str,
        parameters: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate client profile using OpenAI."""
        try:
            prompt = f"""Generate a realistic client profile for a {industry} simulation at difficulty level {difficulty_string}. Include:
- Name
- Age
- Occupation
- Financial situation
- Goals
- Personality traits
- Communication style
- Specific challenges or concerns

Return as JSON."""

            if not self.openai:
                raise ValueError("OpenAI client not configured")

            response = await self.openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a profile generator for financial advisory simulations."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.8,
                max_tokens=800,
            )

            profile_text = response.choices[0].message.content or "{}"

            try:
                return {
                    **json.loads(profile_text),
                    "source": "openai",
                }
            except json.JSONDecodeError:
                return {
                    "name": "Generated Client",
                    "profile": profile_text,
                    "source": "openai",
                }
        except Exception as e:
            logger.error(f"Error generating client profile: {e}")
            raise

    async def generate_conversation_starter(self, client_profile: dict[str, Any]) -> str:
        """
        Generate conversation starter.
        Uses Azure agents with OpenAI fallback.
        """
        # Try Azure agent first
        if self._should_use_azure():
            try:
                agent = agent_manager.get_profile_generation_agent()
                if agent and agent.is_initialized:
                    result = await agent.generate_conversation_starter(client_profile)
                    return result
            except Exception as e:
                logger.warning(f"Azure agent failed, falling back to OpenAI: {e}")

        # Fallback to OpenAI
        return await self._generate_conversation_starter_openai(client_profile)

    async def _generate_conversation_starter_openai(self, client_profile: dict[str, Any]) -> str:
        """Generate conversation starter using OpenAI."""
        try:
            prompt = f"""Given this client profile, generate a realistic opening message from the client starting the conversation with their financial advisor:

{json.dumps(client_profile, indent=2)}

The message should be natural and reflect the client's personality and concerns."""

            if not self.openai:
                raise ValueError("OpenAI client not configured")

            response = await self.openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are roleplaying as a financial advisory client."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.8,
                max_tokens=200,
            )

            return response.choices[0].message.content or "Hello, I'd like to discuss my financial situation."
        except Exception as e:
            logger.error(f"Error generating conversation starter: {e}")
            raise

    async def moderate_content(self, text: str) -> dict[str, Any]:
        """Moderate content for safety."""
        try:
            if not self.openai:
                raise ValueError("OpenAI client not configured")

            response = await self.openai.moderations.create(input=text)

            result = response.results[0]
            flagged_categories = []

            if result.flagged:
                for category, flagged in vars(result.categories).items():
                    if flagged:
                        flagged_categories.append(category)

            return {
                "flagged": result.flagged,
                "categories": flagged_categories,
            }
        except Exception as e:
            logger.error(f"Error moderating content: {e}")
            raise

    async def evaluate_objectives(
        self,
        messages: list[dict[str, Any]],
        api_key: str | None = None,
    ) -> ObjectiveProgress | None:
        """
        Evaluate objective progress.
        Uses Azure agents with OpenAI fallback.
        """
        # Try Azure agent first
        if self._should_use_azure():
            try:
                agent = agent_manager.get_evaluation_agent()
                if agent and agent.is_initialized:
                    result = await agent.evaluate_objectives(messages)
                    if result:
                        return ObjectiveProgress(
                            rapport=result.get("rapport", 0),
                            needs=result.get("needs", 0),
                            objections=result.get("objections", 0),
                            recommendations=result.get("recommendations", 0),
                            explanation=result.get("explanation", ""),
                        )
            except Exception as e:
                logger.warning(f"Azure agent failed, falling back to OpenAI: {e}")

        # Fallback to OpenAI
        return await self._evaluate_objectives_openai(messages, api_key)

    async def _evaluate_objectives_openai(
        self,
        messages: list[dict[str, Any]],
        api_key: str | None = None,
    ) -> ObjectiveProgress | None:
        """Evaluate objectives using OpenAI function calling."""
        try:
            effective_api_key = api_key or self.settings.openai_api_key
            if not effective_api_key:
                logger.warning("No API key for objective evaluation")
                return None

            objective_tracking_messages = [
                {
                    "role": "system",
                    "content": """You are an objective evaluator for a financial advisor training simulation.
Evaluate the advisor's performance based on the conversation history below.
The advisor is the user, and the client is the assistant.
Assess progress on these objectives:
1. Building Rapport: Establishing a connection with the client
2. Needs Assessment: Discovering the client's financial situation and goals
3. Handling Objections: Addressing concerns professionally
4. Providing Recommendations: Suggesting appropriate options based on needs

IMPORTANT SCORING INSTRUCTIONS:
- Scores generally should not decrease unless there is a significant mistake or misstep
- Base your evaluation on the ENTIRE conversation, not just the last message
- Even brief exchanges that show warmth/professionalism should contribute to rapport (10-30%)
- Any questions about client's situation should contribute to needs assessment (15-40%)

Use the trackObjectiveProgress function to report progress percentages (0-100) on each objective.""",
                },
                *[m for m in messages if m.get("role") != "system"],
            ]

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {effective_api_key}",
                    },
                    json={
                        "model": "gpt-4o",
                        "messages": objective_tracking_messages,
                        "temperature": 0.3,
                        "max_tokens": 500,
                        "tools": [
                            {
                                "type": "function",
                                "function": {
                                    "name": "trackObjectiveProgress",
                                    "description": "Track progress on simulation objectives based on the conversation",
                                    "parameters": {
                                        "type": "object",
                                        "properties": {
                                            "rapport": {
                                                "type": "number",
                                                "description": "Progress percentage (0-100) on building rapport with the client",
                                            },
                                            "needs": {
                                                "type": "number",
                                                "description": "Progress percentage (0-100) on needs assessment",
                                            },
                                            "objections": {
                                                "type": "number",
                                                "description": "Progress percentage (0-100) on handling objections",
                                            },
                                            "recommendations": {
                                                "type": "number",
                                                "description": "Progress percentage (0-100) on providing recommendations",
                                            },
                                            "explanation": {
                                                "type": "string",
                                                "description": "Brief explanation of why these progress values were assigned",
                                            },
                                        },
                                        "required": ["rapport", "needs", "objections", "recommendations", "explanation"],
                                    },
                                },
                            },
                        ],
                        "tool_choice": {"type": "function", "function": {"name": "trackObjectiveProgress"}},
                    },
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    if data.get("choices", [{}])[0].get("message", {}).get("tool_calls"):
                        tool_call = data["choices"][0]["message"]["tool_calls"][0]
                        if tool_call.get("function", {}).get("name") == "trackObjectiveProgress":
                            progress = json.loads(tool_call["function"]["arguments"])
                            logger.info(f"Objective progress evaluated: {progress}")
                            return ObjectiveProgress(**progress)

            return None
        except Exception as e:
            logger.error(f"Error evaluating objectives: {e}")
            return None

    async def test_connection(self) -> bool:
        """Test OpenAI connection."""
        try:
            if not self.openai:
                return False

            response = await self.openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5,
            )
            return bool(response.choices[0].message)
        except Exception as e:
            logger.error(f"OpenAI connection test failed: {e}")
            return False

    def _build_system_prompt(self, client_profile: dict[str, Any], parameters: dict[str, Any]) -> str:
        """Build system prompt for client."""
        base_prompt = parameters.get("system_prompt", "You are roleplaying as a financial advisory client.")
        profile_section = f"""
Client Profile:
{json.dumps(client_profile, indent=2)}

Roleplay as this client. Stay in character. Respond naturally based on the client's personality, goals, and concerns."""

        return f"{base_prompt}\n\n{profile_section}"

    def _build_evaluation_prompt(self, competencies: list[dict[str, Any]], rubrics: list[dict[str, Any]]) -> str:
        """Build evaluation prompt."""
        competency_list = "\n".join([f"- {c.get('name', '')}: {c.get('description', '')}" for c in competencies])
        rubric_list = "\n".join([f"- {r.get('criteria', '')} (weight: {r.get('weight', '')})" for r in rubrics])

        return f"""You are an expert evaluator for financial advisory simulations.

Evaluate the advisor's performance based on these competencies:
{competency_list}

Using these rubrics:
{rubric_list}

Provide:
1. Overall score (0-100)
2. Score for each competency (0-100)
3. Overall feedback (2-3 paragraphs)
4. Key strengths (bullet points)
5. Areas for improvement (bullet points)

Return as structured text."""

    def _parse_evaluation(
        self,
        evaluation_text: str,
        competencies: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Parse evaluation response."""
        competency_scores = {c.get("name", ""): 75 for c in competencies}

        return {
            "overallScore": 75,
            "competencyScores": competency_scores,
            "feedback": evaluation_text,
            "strengths": ["Good communication", "Professional demeanor"],
            "improvements": ["More probing questions", "Better needs assessment"],
        }

    async def _get_ai_parameters(self) -> dict[str, Any]:
        """Get AI parameters from database."""
        try:
            params = await parameter_repository.find_by_type("structured")

            param_obj = {}
            for p in params:
                try:
                    if isinstance(p.value, str):
                        param_obj[p.name] = json.loads(p.value)
                    else:
                        param_obj[p.name] = p.value
                except (json.JSONDecodeError, TypeError):
                    param_obj[p.name] = p.value

            return param_obj
        except Exception as e:
            logger.error(f"Error getting AI parameters: {e}")
            return {
                "model": "gpt-4",
                "temperature": 0.7,
                "max_tokens": 500,
                "top_p": 1.0,
                "frequency_penalty": 0.0,
                "presence_penalty": 0.0,
            }


# Singleton instance
ai_service = AIService()
