import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.models.orm import NodeStatus, WorkflowStatus


class NodeSchema(BaseModel):
    id: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    label: str = Field(..., min_length=1)
    config: dict[str, Any] = Field(default_factory=dict)


class EdgeSchema(BaseModel):
    source: str = Field(..., min_length=1)
    target: str = Field(..., min_length=1)


class WorkflowDefinition(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    nodes: list[NodeSchema] = Field(..., min_length=1)
    edges: list[EdgeSchema] = Field(default_factory=list)

    @field_validator("nodes")
    @classmethod
    def validate_unique_node_ids(cls, nodes: list[NodeSchema]) -> list[NodeSchema]:
        ids = [n.id for n in nodes]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate node IDs detected in workflow definition")
        return nodes


class WorkflowResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    definition: dict[str, Any]
    created_at: datetime


class NodeExecutionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    run_id: uuid.UUID
    node_id: str
    node_type: str
    status: NodeStatus
    input_data: dict[str, Any] | None
    output_data: dict[str, Any] | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None


class WorkflowRunResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    workflow_id: uuid.UUID
    status: WorkflowStatus
    execution_plan: list[list[str]]
    celery_task_id: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime


class WorkflowRunDetailResponse(WorkflowRunResponse):
    node_executions: list[NodeExecutionResponse]


class TriggerRunResponse(BaseModel):
    run_id: uuid.UUID
    status: WorkflowStatus
    message: str
