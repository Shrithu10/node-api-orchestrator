import uuid
from datetime import datetime, timezone

from celery import chain, group
from celery.exceptions import MaxRetriesExceededError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings
from app.models.orm import NodeExecution, NodeStatus, WorkflowRun, WorkflowStatus
from app.workers.celery_app import celery_app
from app.workers.executors import executor_registry

_sync_engine = create_engine(
    settings.SYNC_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)
_SyncSession: sessionmaker[Session] = sessionmaker(
    _sync_engine, expire_on_commit=False
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


@celery_app.task(
    bind=True,
    name="app.workers.tasks.execute_workflow",
    acks_late=True,
    max_retries=0,
)
def execute_workflow(self, run_id: str) -> None:
    run_uuid = uuid.UUID(run_id)

    with _SyncSession() as session:
        run = session.get(WorkflowRun, run_uuid)
        if run is None or run.status != WorkflowStatus.PENDING:
            return

        run.status = WorkflowStatus.RUNNING
        run.started_at = _now()
        run.celery_task_id = self.request.id

        levels: list[list[str]] = run.execution_plan
        node_map: dict[str, dict] = {
            n["id"]: n for n in run.workflow_snapshot["nodes"]
        }

        for node_id in (nid for level in levels for nid in level):
            node = node_map[node_id]
            session.add(
                NodeExecution(
                    run_id=run_uuid,
                    node_id=node_id,
                    node_type=node["type"],
                    status=NodeStatus.PENDING,
                )
            )

        session.commit()

    if not levels:
        _do_finalize(run_id, success=True)
        return

    level_groups = [
        group(execute_node.si(run_id, node_id) for node_id in level)
        for level in levels
    ]
    workflow_chain = chain(*level_groups, finalize_workflow_run.si(run_id, True))
    workflow_chain.apply_async()


@celery_app.task(
    bind=True,
    name="app.workers.tasks.execute_node",
    acks_late=True,
    max_retries=3,
    default_retry_delay=5,
)
def execute_node(self, run_id: str, node_id: str) -> None:
    run_uuid = uuid.UUID(run_id)

    with _SyncSession() as session:
        run = session.get(WorkflowRun, run_uuid)
        if run is None or run.status == WorkflowStatus.FAILED:
            return

        node_exec = session.scalars(
            select(NodeExecution).where(
                NodeExecution.run_id == run_uuid,
                NodeExecution.node_id == node_id,
            )
        ).first()

        if node_exec is None or node_exec.status not in (
            NodeStatus.PENDING,
            NodeStatus.RUNNING,
        ):
            return

        node_map: dict[str, dict] = {
            n["id"]: n for n in run.workflow_snapshot["nodes"]
        }
        edges: list[dict] = run.workflow_snapshot["edges"]
        upstream_ids: list[str] = [
            e["source"] for e in edges if e["target"] == node_id
        ]

        upstream_outputs: dict[str, dict] = {}
        if upstream_ids:
            upstream_execs = session.scalars(
                select(NodeExecution).where(
                    NodeExecution.run_id == run_uuid,
                    NodeExecution.node_id.in_(upstream_ids),
                )
            ).all()
            upstream_outputs = {
                ne.node_id: ne.output_data or {} for ne in upstream_execs
            }

        node_cfg = node_map[node_id]
        node_type: str = node_cfg["type"]
        node_config: dict = node_cfg["config"]

        node_exec.status = NodeStatus.RUNNING
        node_exec.started_at = _now()
        node_exec.input_data = {
            "config": node_config,
            "upstream": upstream_outputs,
        }
        session.commit()

    try:
        executor = executor_registry.get(node_type)
        if executor is None:
            raise ValueError(f"No executor registered for node type: {node_type!r}")

        output = executor.execute(node_config, upstream_outputs)

        with _SyncSession() as session:
            node_exec = session.scalars(
                select(NodeExecution).where(
                    NodeExecution.run_id == run_uuid,
                    NodeExecution.node_id == node_id,
                )
            ).first()
            if node_exec:
                node_exec.status = NodeStatus.COMPLETED
                node_exec.completed_at = _now()
                node_exec.output_data = output
                session.commit()

    except Exception as exc:
        try:
            raise self.retry(exc=exc)
        except MaxRetriesExceededError:
            with _SyncSession() as session:
                node_exec = session.scalars(
                    select(NodeExecution).where(
                        NodeExecution.run_id == run_uuid,
                        NodeExecution.node_id == node_id,
                    )
                ).first()
                if node_exec:
                    node_exec.status = NodeStatus.FAILED
                    node_exec.completed_at = _now()
                    node_exec.error_message = str(exc)[:2000]
                    session.commit()

            mark_run_failed.apply_async(
                args=[run_id, str(exc)[:2000]], queue="workflows"
            )
            raise


@celery_app.task(name="app.workers.tasks.finalize_workflow_run")
def finalize_workflow_run(run_id: str, success: bool = True) -> None:
    _do_finalize(run_id, success)


@celery_app.task(name="app.workers.tasks.mark_run_failed")
def mark_run_failed(run_id: str, error_message: str) -> None:
    run_uuid = uuid.UUID(run_id)
    with _SyncSession() as session:
        run = session.get(WorkflowRun, run_uuid)
        if run and run.status not in (
            WorkflowStatus.FAILED,
            WorkflowStatus.COMPLETED,
        ):
            run.status = WorkflowStatus.FAILED
            run.completed_at = _now()
            run.error_message = error_message
            session.commit()


def _do_finalize(run_id: str, success: bool) -> None:
    run_uuid = uuid.UUID(run_id)
    with _SyncSession() as session:
        run = session.get(WorkflowRun, run_uuid)
        if run is None or run.status in (
            WorkflowStatus.FAILED,
            WorkflowStatus.COMPLETED,
        ):
            return
        run.status = WorkflowStatus.COMPLETED if success else WorkflowStatus.FAILED
        run.completed_at = _now()
        session.commit()
