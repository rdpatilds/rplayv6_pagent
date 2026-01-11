"""
Base Agent Class
Abstract base class for all Azure AI Agents
"""

import json
import logging
from abc import ABC, abstractmethod
from typing import Any, AsyncIterator

from azure.ai.agents.aio import AgentsClient
from azure.ai.agents.models import (
    Agent,
    AgentThread,
    ThreadMessage,
    ThreadRun,
    MessageRole,
    RunStatus,
    FunctionTool,
    FunctionToolDefinition,
    FunctionDefinition,
    ToolDefinition,
    RequiredFunctionToolCall,
    SubmitToolOutputsAction,
)
from azure.identity.aio import DefaultAzureCredential

from app.config import get_settings

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Abstract base class for Azure AI Agents.
    Provides common functionality for agent initialization, thread management,
    and message handling.
    """

    def __init__(self, name: str, instructions: str, model: str | None = None):
        """
        Initialize the base agent.

        Args:
            name: Agent name (will be prefixed with configured prefix)
            instructions: System instructions for the agent
            model: Model deployment name (defaults to config value)
        """
        self.settings = get_settings()
        self.name = f"{self.settings.azure_ai_agent_name_prefix}{name}"
        self.instructions = instructions
        self.model = model or self.settings.azure_ai_model_deployment_name

        self._client: AgentsClient | None = None
        self._credential: DefaultAzureCredential | None = None
        self._agent: Agent | None = None
        self._threads: dict[str, AgentThread] = {}
        self._initialized = False

    @property
    def agent_id(self) -> str | None:
        """Get the agent ID if initialized."""
        return self._agent.id if self._agent else None

    @property
    def is_initialized(self) -> bool:
        """Check if agent is initialized."""
        return self._initialized and self._agent is not None

    @abstractmethod
    def get_tools(self) -> list[ToolDefinition]:
        """
        Get tool definitions for this agent.
        Must be implemented by subclasses.
        """
        pass

    @abstractmethod
    async def handle_tool_call(self, tool_name: str, arguments: dict[str, Any]) -> str:
        """
        Handle a tool call from the agent.
        Must be implemented by subclasses.

        Args:
            tool_name: Name of the tool being called
            arguments: Arguments passed to the tool

        Returns:
            Tool output as a string
        """
        pass

    async def initialize(self) -> bool:
        """
        Initialize the agent with Azure AI.
        First searches for existing agent by name, creates new one if not found.

        Returns:
            True if initialization was successful
        """
        try:
            if not self.settings.azure_ai_project_endpoint:
                logger.warning(f"[{self.name}] Azure AI endpoint not configured")
                return False

            logger.info(f"[{self.name}] Initializing agent...")
            logger.info(f"[{self.name}] Using Azure AI endpoint: {self.settings.azure_ai_project_endpoint[:50]}...")

            # Create credential and client
            self._credential = DefaultAzureCredential()
            self._client = AgentsClient(
                endpoint=self.settings.azure_ai_project_endpoint,
                credential=self._credential,
            )
            logger.info(f"[{self.name}] Azure client created successfully")

            # Search for existing agent by name
            logger.info(f"[{self.name}] Searching for existing agent with name: {self.name}")
            existing_agent = None

            try:
                agents_list = self._client.list_agents()
                async for agent in agents_list:
                    if agent.name == self.name:
                        existing_agent = agent
                        logger.info(f"[{self.name}] Found existing agent: {agent.id}")
                        break
            except Exception as list_error:
                logger.warning(f"[{self.name}] Error listing agents: {list_error}")

            if existing_agent:
                # Reuse existing agent
                self._agent = existing_agent
                logger.info(f"[{self.name}] Reusing existing Azure AI Agent: {self._agent.id}")
            else:
                # Create new agent
                logger.info(f"[{self.name}] No existing agent found, creating new agent...")

                # Get tool definitions
                tools = self.get_tools()
                logger.info(f"[{self.name}] Agent will have {len(tools)} tools")

                self._agent = await self._client.create_agent(
                    model=self.model,
                    name=self.name,
                    instructions=self.instructions,
                    tools=tools,
                )
                logger.info(f"[{self.name}] Created new Azure AI Agent: {self._agent.id}")

            self._initialized = True
            logger.info(f"[{self.name}] Agent initialization complete - ID: {self._agent.id}")
            return True

        except Exception as e:
            logger.error(f"[{self.name}] Failed to initialize agent: {e}")
            import traceback
            logger.error(f"[{self.name}] Traceback: {traceback.format_exc()}")
            self._initialized = False
            return False

    async def create_thread(self, session_id: str | None = None) -> str:
        """
        Create a new conversation thread.

        Args:
            session_id: Optional session ID to associate with thread

        Returns:
            Thread ID
        """
        if not self._client or not self._agent:
            raise RuntimeError(f"[{self.name}] Agent not initialized")

        thread = await self._client.threads.create()
        thread_id = thread.id

        if session_id:
            self._threads[session_id] = thread

        logger.debug(f"[{self.name}] Created thread: {thread_id}")
        return thread_id

    async def get_or_create_thread(self, session_id: str) -> str:
        """
        Get existing thread for session or create new one.

        Args:
            session_id: Session identifier

        Returns:
            Thread ID
        """
        if session_id in self._threads:
            return self._threads[session_id].id
        return await self.create_thread(session_id)

    async def send_message(
        self,
        thread_id: str,
        content: str,
        context: dict[str, Any] | None = None,
    ) -> str:
        """
        Send a message to the agent and get a response.

        Args:
            thread_id: Thread ID to send message to
            content: Message content
            context: Optional context data for tool calls

        Returns:
            Agent response text
        """
        if not self._client or not self._agent:
            raise RuntimeError(f"[{self.name}] Agent not initialized")

        # Store context for tool calls
        self._current_context = context or {}

        # Create message
        await self._client.messages.create(
            thread_id=thread_id,
            role=MessageRole.USER,
            content=content,
        )

        # Run agent and process tool calls
        run = await self._client.runs.create(
            thread_id=thread_id,
            agent_id=self._agent.id,
        )

        # Process run until completion
        response = await self._process_run(thread_id, run)

        return response

    async def _process_run(self, thread_id: str, run: ThreadRun) -> str:
        """
        Process a run until completion, handling any tool calls.

        Args:
            thread_id: Thread ID
            run: Initial run object

        Returns:
            Final agent response text
        """
        if not self._client:
            raise RuntimeError(f"[{self.name}] Agent not initialized")

        while run.status in [RunStatus.QUEUED, RunStatus.IN_PROGRESS, RunStatus.REQUIRES_ACTION]:
            if run.status == RunStatus.REQUIRES_ACTION:
                # Handle tool calls
                if isinstance(run.required_action, SubmitToolOutputsAction):
                    tool_outputs = []
                    for tool_call in run.required_action.submit_tool_outputs.tool_calls:
                        if isinstance(tool_call, RequiredFunctionToolCall):
                            try:
                                arguments = json.loads(tool_call.function.arguments)
                                output = await self.handle_tool_call(
                                    tool_call.function.name,
                                    arguments,
                                )
                                tool_outputs.append({
                                    "tool_call_id": tool_call.id,
                                    "output": output,
                                })
                            except Exception as e:
                                logger.error(f"[{self.name}] Tool call error: {e}")
                                tool_outputs.append({
                                    "tool_call_id": tool_call.id,
                                    "output": json.dumps({"error": str(e)}),
                                })

                    # Submit tool outputs
                    run = await self._client.runs.submit_tool_outputs(
                        thread_id=thread_id,
                        run_id=run.id,
                        tool_outputs=tool_outputs,
                    )
            else:
                # Wait and poll for status update
                import asyncio
                await asyncio.sleep(0.5)
                run = await self._client.runs.get(thread_id=thread_id, run_id=run.id)

        if run.status == RunStatus.FAILED:
            error_msg = run.last_error.message if run.last_error else "Unknown error"
            logger.error(f"[{self.name}] Run failed: {error_msg}")
            raise RuntimeError(f"Agent run failed: {error_msg}")

        # Get the latest assistant message
        messages = await self._client.messages.list(thread_id=thread_id)
        for msg in messages.data:
            if msg.role == MessageRole.ASSISTANT:
                # Return first text content
                for content in msg.content:
                    if hasattr(content, "text") and content.text:
                        return content.text.value
                break

        return ""

    async def send_message_streaming(
        self,
        thread_id: str,
        content: str,
        context: dict[str, Any] | None = None,
    ) -> AsyncIterator[str]:
        """
        Send a message and stream the response.

        Args:
            thread_id: Thread ID to send message to
            content: Message content
            context: Optional context data for tool calls

        Yields:
            Response text chunks
        """
        if not self._client or not self._agent:
            raise RuntimeError(f"[{self.name}] Agent not initialized")

        # Store context for tool calls
        self._current_context = context or {}

        # Create message
        await self._client.messages.create(
            thread_id=thread_id,
            role=MessageRole.USER,
            content=content,
        )

        # Create and stream run
        async with await self._client.runs.stream(
            thread_id=thread_id,
            agent_id=self._agent.id,
        ) as stream:
            async for event in stream:
                if hasattr(event, "data") and hasattr(event.data, "delta"):
                    delta = event.data.delta
                    if hasattr(delta, "content"):
                        for content_block in delta.content:
                            if hasattr(content_block, "text") and content_block.text:
                                yield content_block.text.value

    async def cleanup(self) -> None:
        """Clean up agent resources."""
        try:
            if self._client and self._agent:
                await self._client.delete_agent(self._agent.id)
                logger.info(f"[{self.name}] Agent deleted: {self._agent.id}")

            # Clear threads
            self._threads.clear()
            self._agent = None
            self._initialized = False

            # Close credential
            if self._credential:
                await self._credential.close()
                self._credential = None

            # Close client (if it has close method)
            if self._client and hasattr(self._client, "close"):
                await self._client.close()
            self._client = None

        except Exception as e:
            logger.error(f"[{self.name}] Error during cleanup: {e}")

    def create_function_tool(
        self,
        name: str,
        description: str,
        parameters: dict[str, Any],
    ) -> FunctionToolDefinition:
        """
        Helper to create a function tool definition.

        Args:
            name: Function name
            description: Function description
            parameters: JSON Schema for parameters

        Returns:
            FunctionToolDefinition
        """
        return FunctionToolDefinition(
            function=FunctionDefinition(
                name=name,
                description=description,
                parameters=parameters,
            )
        )
