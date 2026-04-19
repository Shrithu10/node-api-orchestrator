import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    CyclicDependencyError,
    InvalidDAGError,
    WorkflowNotFoundError,
    WorkflowRunNotFoundError,
)
from app.database import get_db
from app.schemas.workflow import (
    TriggerRunResponse,
    WorkflowDefinition,
    WorkflowResponse,
    WorkflowRunDetailResponse,
    WorkflowRunResponse,
)
from app.services.workflow import WorkflowService

router = APIRouter()


def _service(db: AsyncSession = Depends(get_db)) -> WorkflowService:
    return WorkflowService(db)


@router.post(
    "/workflows",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_workflow(
    payload: WorkflowDefinition,
    svc: WorkflowService = Depends(_service),
) -> WorkflowResponse:
    try:
        workflow = await svc.create_workflow(payload)
        return WorkflowResponse.model_validate(workflow)
    except (CyclicDependencyError, InvalidDAGError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        )


@router.get("/workflows", response_model=list[WorkflowResponse])
async def list_workflows(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    svc: WorkflowService = Depends(_service),
) -> list[WorkflowResponse]:
    workflows = await svc.list_workflows(limit=limit, offset=offset)
    return [WorkflowResponse.model_validate(w) for w in workflows]


@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: uuid.UUID,
    svc: WorkflowService = Depends(_service),
) -> WorkflowResponse:
    try:
        workflow = await svc.get_workflow(workflow_id)
        return WorkflowResponse.model_validate(workflow)
    except WorkflowNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post(
    "/workflows/{workflow_id}/runs",
    response_model=TriggerRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_workflow_run(
    workflow_id: uuid.UUID,
    svc: WorkflowService = Depends(_service),
) -> TriggerRunResponse:
    try:
        run = await svc.trigger_run(workflow_id)
        return TriggerRunResponse(
            run_id=run.id,
            status=run.status,
            message="Workflow run accepted and dispatched to execution queue",
        )
    except WorkflowNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (CyclicDependencyError, InvalidDAGError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        )


@router.get(
    "/workflows/{workflow_id}/runs",
    response_model=list[WorkflowRunResponse],
)
async def list_workflow_runs(
    workflow_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    svc: WorkflowService = Depends(_service),
) -> list[WorkflowRunResponse]:
    try:
        runs = await svc.list_runs(workflow_id, limit=limit, offset=offset)
        return [WorkflowRunResponse.model_validate(r) for r in runs]
    except WorkflowNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("/runs/{run_id}", response_model=WorkflowRunDetailResponse)
async def get_run(
    run_id: uuid.UUID,
    svc: WorkflowService = Depends(_service),
) -> WorkflowRunDetailResponse:
    try:
        run = await svc.get_run_detail(run_id)
        return WorkflowRunDetailResponse.model_validate(run)
    except WorkflowRunNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
