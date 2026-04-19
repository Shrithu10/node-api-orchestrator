import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dag import topological_sort_levels
from app.core.exceptions import WorkflowNotFoundError, WorkflowRunNotFoundError
from app.models.orm import Workflow, WorkflowRun
from app.repositories.run import WorkflowRepository, WorkflowRunRepository
from app.schemas.workflow import WorkflowDefinition


class WorkflowService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._workflow_repo = WorkflowRepository(session)
        self._run_repo = WorkflowRunRepository(session)

    async def create_workflow(self, payload: WorkflowDefinition) -> Workflow:
        topological_sort_levels(payload.nodes, payload.edges)
        return await self._workflow_repo.create(
            name=payload.name,
            definition=payload.model_dump(),
        )

    async def get_workflow(self, workflow_id: uuid.UUID) -> Workflow:
        workflow = await self._workflow_repo.get_by_id(workflow_id)
        if workflow is None:
            raise WorkflowNotFoundError(f"Workflow {workflow_id} not found")
        return workflow

    async def list_workflows(self, limit: int = 100, offset: int = 0) -> list[Workflow]:
        return await self._workflow_repo.list_all(limit=limit, offset=offset)

    async def trigger_run(self, workflow_id: uuid.UUID) -> WorkflowRun:
        from app.workers.tasks import execute_workflow

        workflow = await self._workflow_repo.get_by_id(workflow_id)
        if workflow is None:
            raise WorkflowNotFoundError(f"Workflow {workflow_id} not found")

        definition = WorkflowDefinition.model_validate(workflow.definition)
        levels = topological_sort_levels(definition.nodes, definition.edges)

        run = await self._run_repo.create(
            workflow_id=workflow_id,
            execution_plan=levels,
            workflow_snapshot=workflow.definition,
        )

        task = execute_workflow.apply_async(args=[str(run.id)], queue="workflows")
        run.celery_task_id = task.id

        return run

    async def get_run(self, run_id: uuid.UUID) -> WorkflowRun:
        run = await self._run_repo.get_by_id(run_id)
        if run is None:
            raise WorkflowRunNotFoundError(f"Run {run_id} not found")
        return run

    async def get_run_detail(self, run_id: uuid.UUID) -> WorkflowRun:
        run = await self._run_repo.get_with_node_executions(run_id)
        if run is None:
            raise WorkflowRunNotFoundError(f"Run {run_id} not found")
        return run

    async def list_runs(
        self, workflow_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> list[WorkflowRun]:
        workflow = await self._workflow_repo.get_by_id(workflow_id)
        if workflow is None:
            raise WorkflowNotFoundError(f"Workflow {workflow_id} not found")
        return await self._run_repo.list_for_workflow(
            workflow_id, limit=limit, offset=offset
        )
