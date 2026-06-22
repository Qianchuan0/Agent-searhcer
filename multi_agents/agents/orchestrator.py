import os
import time
import datetime
import hashlib
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import InMemorySaver
from .utils.views import print_agent_output
from ..memory.research import ResearchState
from .utils.utils import sanitize_filename
from .plan_review import (
    DEFAULT_MAX_PLAN_REVISIONS,
    route_human_feedback,
)

# Import agent classes
from . import \
    WriterAgent, \
    EditorAgent, \
    PublisherAgent, \
    ResearchAgent, \
    HumanAgent


CHECKPOINTER = InMemorySaver()


class ChiefEditorAgent:
    """Agent responsible for managing and coordinating editing tasks."""

    def __init__(self, task: dict, websocket=None, stream_output=None, tone=None, headers=None):
        self.task = task
        self.websocket = websocket
        self.stream_output = stream_output
        self.headers = headers or {}
        self.tone = tone
        self.task_id = self._generate_task_id()
        self.output_dir = self._create_output_directory()

    def _generate_task_id(self):
        # Currently time based, but can be any unique identifier
        return int(time.time())

    def _create_output_directory(self):
        query = self.task.get("query", "")
        query_hash = hashlib.md5(query.encode("utf-8", errors="ignore")).hexdigest()[:10]
        output_dir = "./outputs/" + \
            sanitize_filename(
                f"run_{self.task_id}_{query_hash}")

        os.makedirs(output_dir, exist_ok=True)
        return output_dir

    def _initialize_agents(self):
        return {
            "writer": WriterAgent(self.websocket, self.stream_output, self.headers),
            "editor": EditorAgent(self.websocket, self.stream_output, self.tone, self.headers),
            "research": ResearchAgent(self.websocket, self.stream_output, self.tone, self.headers),
            "publisher": PublisherAgent(self.output_dir, self.websocket, self.stream_output, self.headers),
            "human": HumanAgent(self.websocket, self.stream_output, self.headers)
        }

    def _create_workflow(self, agents):
        workflow = StateGraph(ResearchState)

        # Add nodes for each agent
        workflow.add_node("browser", agents["research"].run_initial_research)
        workflow.add_node("planner", agents["editor"].plan_research)
        workflow.add_node("researcher", agents["editor"].run_parallel_research)
        workflow.add_node("writer", agents["writer"].run)
        workflow.add_node("publisher", agents["publisher"].run)
        workflow.add_node("human", agents["human"].review_plan)

        # Add edges
        self._add_workflow_edges(workflow)

        return workflow

    def _add_workflow_edges(self, workflow):
        workflow.add_edge('browser', 'planner')
        workflow.add_edge('planner', 'human')
        workflow.add_edge('researcher', 'writer')
        workflow.add_edge('writer', 'publisher')
        workflow.set_entry_point("browser")
        workflow.add_edge('publisher', END)

        # Add human in the loop
        workflow.add_conditional_edges(
            'human',
            self._route_human_feedback,
            {"accept": "researcher", "revise": "planner"}
        )

    def _route_human_feedback(self, review):
        max_plan_revisions = self.task.get(
            "max_plan_revisions", DEFAULT_MAX_PLAN_REVISIONS)
        return route_human_feedback(review, max_plan_revisions)

    def init_research_team(self):
        """Initialize and create a workflow for the research team."""
        agents = self._initialize_agents()
        return self._create_workflow(agents)

    def compile_research_team(self):
        research_team = self.init_research_team()
        return research_team.compile(checkpointer=CHECKPOINTER)

    async def _log_research_start(self):
        message = f"Starting the research process for query '{self.task.get('query')}'..."
        if self.websocket and self.stream_output:
            await self.stream_output("logs", "starting_research", message, self.websocket)
        else:
            print_agent_output(message, "MASTER")

    async def run_research_task(self, task_id=None):
        """
        Run a research task with the initialized research team.

        Args:
            task_id (optional): The ID of the task to run.

        Returns:
            The result of the research task.
        """
        chain = self.compile_research_team()

        await self._log_research_start()

        config = {
            "configurable": {
                "thread_id": task_id or str(self.task_id),
                "thread_ts": datetime.datetime.utcnow()
            }
        }

        result = await chain.ainvoke({"task": self.task}, config=config)
        return result
