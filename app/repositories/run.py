import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.orm import NodeExecution, Workflow, WorkflowRun


class WorkflowRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, name: str, definition: dict) -> Workflow:
        workflow = Workflow(name=name, definition=definition)
        self._session.add(workflow)
        await self._session.flush()
        await self._session.refresh(workflow)
        return workflow

    async def get_by_id(self, workflow_id: uuid.UUID) -> Workflow | None:
        return await self._session.get(Workflow, workflow_id)

    async def list_all(self, limit: int = 100, offset: int = 0) -> list[Workflow]:
        stmt = (
            select(Workflow)
            .order_by(Workflow.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.scalars(stmt)
        return list(result.all())


class WorkflowRunRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        workflow_id: uuid.UUID,
        execution_plan: list[list[str]],
        workflow_snapshot: dict,
    ) -> WorkflowRun:
        run = WorkflowRun(
            workflow_id=workflow_id,
            execution_plan=execution_plan,
            workflow_snapshot=workflow_snapshot,
        )
        self._session.add(run)
        await self._session.flush()
        await self._session.refresh(run)
        return run

    async def get_by_id(self, run_id: uuid.UUID) -> WorkflowRun | None:
        return await self._session.get(WorkflowRun, run_id)

    async def get_with_node_executions(self, run_id: uuid.UUID) -> WorkflowRun | None:
        stmt = (
            select(WorkflowRun)
            .options(selectinload(WorkflowRun.node_executions))
            .where(WorkflowRun.id == run_id)
        )
        result = await self._session.scalars(stmt)
        return result.first()

    async def list_for_workflow(
        self, workflow_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> list[WorkflowRun]:
        stmt = (
            select(WorkflowRun)
            .where(WorkflowRun.workflow_id == workflow_id)
            .order_by(WorkflowRun.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.scalars(stmt)
        return list(result.all())

    async def get_node_executions(self, run_id: uuid.UUID) -> list[NodeExecution]:
        stmt = select(NodeExecution).where(NodeExecution.run_id == run_id)
        result = await self._session.scalars(stmt)
        return list(result.all())
