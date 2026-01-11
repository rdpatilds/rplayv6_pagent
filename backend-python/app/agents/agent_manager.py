"""
Agent Manager
Singleton manager for agent lifecycle and coordination
"""

import logging
from typing import TYPE_CHECKING

from app.config import get_settings, is_azure_configured

if TYPE_CHECKING:
    from app.agents.base_agent import BaseAgent
    from app.agents.simulation_client_agent import SimulationClientAgent
    from app.agents.profile_generation_agent import ProfileGenerationAgent
    from app.agents.evaluation_agent import EvaluationAgent
    from app.agents.expert_guidance_agent import ExpertGuidanceAgent

logger = logging.getLogger(__name__)


class AgentManager:
    """
    Singleton manager for Azure AI Agents.
    Handles agent lifecycle, initialization, and retrieval.
    """

    _instance: "AgentManager | None" = None

    def __new__(cls) -> "AgentManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._agents: dict[str, "BaseAgent"] = {}
        self._azure_available = False
        self._initialization_errors: dict[str, str] = {}
        self._initialized = True
        self.settings = get_settings()

    @property
    def is_azure_configured(self) -> bool:
        """Check if Azure AI is configured."""
        return is_azure_configured()

    @property
    def is_azure_available(self) -> bool:
        """Check if Azure AI agents are available."""
        return self._azure_available

    def get_agent(self, name: str) -> "BaseAgent | None":
        """
        Get an initialized agent by name.

        Args:
            name: Agent name (without prefix)

        Returns:
            Agent instance or None if not found/initialized
        """
        full_name = f"{self.settings.azure_ai_agent_name_prefix}{name}"
        return self._agents.get(full_name)

    def get_simulation_client_agent(self) -> "SimulationClientAgent | None":
        """Get the simulation client agent."""
        return self.get_agent("simulation-client")  # type: ignore

    def get_profile_generation_agent(self) -> "ProfileGenerationAgent | None":
        """Get the profile generation agent."""
        return self.get_agent("profile-generation")  # type: ignore

    def get_evaluation_agent(self) -> "EvaluationAgent | None":
        """Get the evaluation agent."""
        return self.get_agent("evaluation")  # type: ignore

    def get_expert_guidance_agent(self) -> "ExpertGuidanceAgent | None":
        """Get the expert guidance agent."""
        return self.get_agent("expert-guidance")  # type: ignore

    async def initialize_all(self) -> dict[str, bool]:
        """
        Initialize all agents.

        Returns:
            Dictionary of agent names to initialization success status
        """
        logger.info("=" * 60)
        logger.info("[AgentManager] Starting Azure AI Agents initialization...")
        logger.info(f"[AgentManager] Azure configured: {self.is_azure_configured}")
        logger.info(f"[AgentManager] OpenAI fallback available: {bool(self.settings.openai_api_key)}")

        if not self.is_azure_configured:
            logger.warning("[AgentManager] Azure AI not configured - will use OpenAI fallback")
            logger.info("=" * 60)
            return {}

        logger.info(f"[AgentManager] Azure endpoint: {self.settings.azure_ai_project_endpoint[:50]}...")
        logger.info(f"[AgentManager] Model deployment: {self.settings.azure_ai_model_deployment_name}")
        logger.info(f"[AgentManager] Agent name prefix: {self.settings.azure_ai_agent_name_prefix}")

        # Import agents here to avoid circular imports
        from app.agents.simulation_client_agent import SimulationClientAgent
        from app.agents.profile_generation_agent import ProfileGenerationAgent
        from app.agents.evaluation_agent import EvaluationAgent
        from app.agents.expert_guidance_agent import ExpertGuidanceAgent

        # Define agents to initialize
        agent_classes = [
            SimulationClientAgent,
            ProfileGenerationAgent,
            EvaluationAgent,
            ExpertGuidanceAgent,
        ]

        logger.info(f"[AgentManager] Will initialize {len(agent_classes)} agents:")
        for cls in agent_classes:
            logger.info(f"[AgentManager]   - {cls.__name__}")

        results: dict[str, bool] = {}
        successful = 0

        for agent_class in agent_classes:
            agent = agent_class()
            logger.info(f"[AgentManager] Initializing {agent.name}...")
            try:
                success = await agent.initialize()
                self._agents[agent.name] = agent
                results[agent.name] = success

                if success:
                    successful += 1
                    logger.info(f"[AgentManager] ✓ {agent.name} initialized (ID: {agent.agent_id})")
                else:
                    self._initialization_errors[agent.name] = "Initialization returned False"
                    logger.warning(f"[AgentManager] ✗ {agent.name} failed to initialize")

            except Exception as e:
                results[agent.name] = False
                self._initialization_errors[agent.name] = str(e)
                logger.error(f"[AgentManager] ✗ Error initializing {agent.name}: {e}")

        self._azure_available = successful > 0

        logger.info("=" * 60)
        logger.info(f"[AgentManager] Initialization complete: {successful}/{len(agent_classes)} agents")
        if successful > 0:
            logger.info("[AgentManager] AI Backend: Azure AI Agents (primary)")
        else:
            logger.info("[AgentManager] AI Backend: OpenAI (fallback)")

        for name, agent in self._agents.items():
            status = "✓" if agent.is_initialized else "✗"
            agent_id = agent.agent_id or "N/A"
            logger.info(f"[AgentManager]   {status} {name}: {agent_id}")

        if self._initialization_errors:
            logger.warning("[AgentManager] Errors encountered:")
            for name, error in self._initialization_errors.items():
                logger.warning(f"[AgentManager]   - {name}: {error}")

        logger.info("=" * 60)

        return results

    async def cleanup_all(self) -> None:
        """Clean up all agents."""
        for name, agent in list(self._agents.items()):
            try:
                await agent.cleanup()
                logger.info(f"[AgentManager] Cleaned up {name}")
            except Exception as e:
                logger.error(f"[AgentManager] Error cleaning up {name}: {e}")

        self._agents.clear()
        self._azure_available = False
        self._initialization_errors.clear()

    def get_status(self) -> dict:
        """
        Get status of all agents.

        Returns:
            Status dictionary
        """
        return {
            "azure_configured": self.is_azure_configured,
            "azure_available": self._azure_available,
            "agents": {
                name: {
                    "initialized": agent.is_initialized,
                    "agent_id": agent.agent_id,
                }
                for name, agent in self._agents.items()
            },
            "errors": self._initialization_errors,
        }

    def get_health(self) -> dict:
        """
        Get health check for agents.

        Returns:
            Health status dictionary
        """
        agent_count = len(self._agents)
        initialized_count = sum(1 for a in self._agents.values() if a.is_initialized)

        if not self.is_azure_configured:
            status = "unconfigured"
        elif initialized_count == 0:
            status = "unavailable"
        elif initialized_count < agent_count:
            status = "degraded"
        else:
            status = "healthy"

        return {
            "status": status,
            "azure_configured": self.is_azure_configured,
            "agents_total": agent_count,
            "agents_initialized": initialized_count,
            "fallback_available": bool(self.settings.openai_api_key),
        }


# Singleton instance
agent_manager = AgentManager()
