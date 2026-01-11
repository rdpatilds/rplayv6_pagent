"""
Evaluation Agent
Evaluates advisor performance and tracks objectives
"""

import json
import logging
from typing import Any

from azure.ai.agents.models import ToolDefinition, FunctionTool, FunctionToolDefinition, FunctionDefinition

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


EVALUATION_INSTRUCTIONS = """You are an expert evaluator for financial advisor training simulations. Your role is to analyze conversations between advisors and clients, providing fair and constructive assessments.

EVALUATION GUIDELINES:
1. Base evaluations on observable behaviors in the conversation
2. Provide specific, actionable feedback
3. Balance positive recognition with areas for improvement
4. Consider the difficulty level when evaluating
5. Be constructive, not discouraging

COMPETENCY AREAS:
- Building Rapport: Establishing connection and trust
- Needs Assessment: Discovering client's situation and goals
- Handling Objections: Addressing concerns professionally
- Providing Recommendations: Suggesting appropriate solutions

Use the available tools to:
- Get competency definitions and rubrics
- Calculate scores based on observed behaviors
- Track objective progress throughout conversations

Always provide evidence-based assessments with specific examples from the conversation."""


class EvaluationAgent(BaseAgent):
    """
    Agent that evaluates advisor performance and generates reviews.
    Provides scoring, feedback, and objective tracking.
    """

    def __init__(self):
        super().__init__(
            name="evaluation",
            instructions=EVALUATION_INSTRUCTIONS,
            model=None,
        )
        self._competencies: list[dict[str, Any]] = []
        self._rubrics: list[dict[str, Any]] = []

    def get_tools(self) -> list[ToolDefinition]:
        """Get tool definitions for the evaluation agent."""
        return [
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="get_competencies",
                    description="Get the competency definitions being evaluated.",
                    parameters={
                        "type": "object",
                        "properties": {},
                        "required": [],
                    },
                ),
            ),
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="get_rubrics",
                    description="Get the evaluation rubrics with criteria and weights.",
                    parameters={
                        "type": "object",
                        "properties": {},
                        "required": [],
                    },
                ),
            ),
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="calculate_scores",
                    description="Calculate competency scores based on observations.",
                    parameters={
                        "type": "object",
                        "properties": {
                            "observations": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "competency": {"type": "string"},
                                        "score": {"type": "number"},
                                        "evidence": {"type": "string"},
                                    },
                                },
                                "description": "List of competency observations with scores and evidence",
                            },
                        },
                        "required": ["observations"],
                    },
                ),
            ),
            FunctionToolDefinition(
                function=FunctionDefinition(
                    name="track_objective_progress",
                    description="Track progress on simulation objectives based on the conversation.",
                    parameters={
                        "type": "object",
                        "properties": {
                            "rapport": {
                                "type": "number",
                                "description": "Progress percentage (0-100) on building rapport",
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
                                "description": "Brief explanation of progress assessment",
                            },
                        },
                        "required": ["rapport", "needs", "objections", "recommendations", "explanation"],
                    },
                ),
            ),
        ]

    async def handle_tool_call(self, tool_name: str, arguments: dict[str, Any]) -> str:
        """Handle tool calls from the agent."""
        context = getattr(self, "_current_context", {})

        if tool_name == "get_competencies":
            competencies = context.get("competencies", self._competencies)
            if not competencies:
                competencies = [
                    {"name": "Building Rapport", "description": "Establishing connection and trust with clients"},
                    {"name": "Needs Assessment", "description": "Discovering client's financial situation and goals"},
                    {"name": "Handling Objections", "description": "Addressing concerns professionally"},
                    {"name": "Providing Recommendations", "description": "Suggesting appropriate financial solutions"},
                ]
            return json.dumps(competencies)

        elif tool_name == "get_rubrics":
            rubrics = context.get("rubrics", self._rubrics)
            if not rubrics:
                rubrics = [
                    {"criteria": "Active listening and empathy", "weight": 25},
                    {"criteria": "Questioning techniques", "weight": 25},
                    {"criteria": "Problem-solving ability", "weight": 25},
                    {"criteria": "Communication clarity", "weight": 25},
                ]
            return json.dumps(rubrics)

        elif tool_name == "calculate_scores":
            observations = arguments.get("observations", [])
            scores = {}
            for obs in observations:
                competency = obs.get("competency", "")
                score = obs.get("score", 0)
                scores[competency] = {
                    "score": score,
                    "evidence": obs.get("evidence", ""),
                }
            return json.dumps({"calculated_scores": scores})

        elif tool_name == "track_objective_progress":
            # Return the progress data for use in response
            return json.dumps({
                "rapport": arguments.get("rapport", 0),
                "needs": arguments.get("needs", 0),
                "objections": arguments.get("objections", 0),
                "recommendations": arguments.get("recommendations", 0),
                "explanation": arguments.get("explanation", ""),
            })

        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    async def generate_review(
        self,
        messages: list[dict[str, Any]],
        competencies: list[dict[str, Any]] | None = None,
        difficulty: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate a performance review.

        Args:
            messages: Conversation history
            competencies: Competencies being evaluated
            difficulty: Difficulty level

        Returns:
            Review dictionary with scores and feedback
        """
        if not self.is_initialized:
            raise RuntimeError("EvaluationAgent not initialized")

        self._competencies = competencies or []

        context = {
            "competencies": competencies or [],
            "difficulty": difficulty,
        }

        # Format conversation
        conversation_text = self._format_conversation(messages)

        competency_names = [c.get("name", "") for c in (competencies or [])]
        competency_list = ", ".join(competency_names) if competency_names else "General performance"

        prompt = f"""Evaluate this advisor-client conversation and generate a detailed performance review.

Difficulty Level: {difficulty or 'Not specified'}
Competencies Being Evaluated: {competency_list}

Conversation:
{conversation_text}

Generate a comprehensive performance review with:
1. An overall score (1-10)
2. Individual competency scores (1-10 each)
3. Specific strengths observed (with examples)
4. Areas for improvement (with suggestions)
5. A summary of overall performance

Return your evaluation as a JSON object:
{{
  "overallScore": <number 1-10>,
  "competencyScores": [
    {{"name": "<competency>", "score": <number 1-10>, "strengths": ["..."], "improvements": ["..."], "expectation": "..."}}
  ],
  "generalStrengths": ["strength1", "strength2"],
  "generalImprovements": ["improvement1", "improvement2"],
  "summary": "Overall performance summary..."
}}"""

        thread_id = await self.create_thread()
        response_text = await self.send_message(thread_id, prompt, context)

        # Parse JSON response
        try:
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned.replace("```json", "").replace("```", "").strip()
            elif cleaned.startswith("```"):
                cleaned = cleaned.replace("```", "").strip()

            review = json.loads(cleaned)
            review["source"] = "azure-agent"
            return review
        except json.JSONDecodeError as e:
            logger.error(f"[EvaluationAgent] Failed to parse review JSON: {e}")
            return {
                "overallScore": 5,
                "competencyScores": [],
                "generalStrengths": ["Unable to parse detailed feedback"],
                "generalImprovements": ["Please try generating the review again"],
                "summary": response_text[:500] if response_text else "Review generation failed",
                "source": "azure-agent",
                "parse_error": True,
            }

    async def evaluate_objectives(
        self,
        messages: list[dict[str, Any]],
    ) -> dict[str, Any] | None:
        """
        Evaluate objective progress based on conversation.

        Args:
            messages: Conversation history

        Returns:
            Objective progress dictionary or None
        """
        if not self.is_initialized:
            raise RuntimeError("EvaluationAgent not initialized")

        conversation_text = self._format_conversation(messages)

        prompt = f"""Evaluate the advisor's performance in this conversation and assess progress on these objectives:

1. Building Rapport: Establishing connection with the client (0-100%)
2. Needs Assessment: Discovering client's financial situation and goals (0-100%)
3. Handling Objections: Addressing concerns professionally (0-100%)
4. Providing Recommendations: Suggesting appropriate options (0-100%)

IMPORTANT SCORING INSTRUCTIONS:
- Base your evaluation on the ENTIRE conversation, not just the last message
- Scores should generally not decrease unless there's a significant mistake
- Even brief exchanges showing warmth/professionalism contribute to rapport (10-30%)
- Questions about client's situation contribute to needs assessment (15-40%)

Conversation:
{conversation_text}

Use the track_objective_progress tool to report your assessment."""

        thread_id = await self.create_thread()

        try:
            response_text = await self.send_message(thread_id, prompt, {})

            # Try to extract progress from response
            try:
                cleaned = response_text.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned.replace("```json", "").replace("```", "").strip()
                elif cleaned.startswith("```"):
                    cleaned = cleaned.replace("```", "").strip()

                progress = json.loads(cleaned)
                return {
                    "rapport": progress.get("rapport", 0),
                    "needs": progress.get("needs", 0),
                    "objections": progress.get("objections", 0),
                    "recommendations": progress.get("recommendations", 0),
                    "explanation": progress.get("explanation", ""),
                    "source": "azure-agent",
                }
            except json.JSONDecodeError:
                # If not JSON, return None
                logger.warning(f"[EvaluationAgent] Could not parse objective progress from response")
                return None

        except Exception as e:
            logger.error(f"[EvaluationAgent] Error evaluating objectives: {e}")
            return None

    def _format_conversation(self, messages: list[dict[str, Any]]) -> str:
        """Format conversation for evaluation."""
        formatted = []
        for msg in messages:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            if role == "system":
                continue
            label = "Advisor" if role == "user" else "Client"
            formatted.append(f"{label}: {content}")
        return "\n".join(formatted) if formatted else "(No conversation)"
