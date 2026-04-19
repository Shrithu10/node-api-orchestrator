from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient

_LINEAR_WORKFLOW = {
    "name": "Linear Pipeline",
    "nodes": [
        {"id": "n1", "type": "noop", "label": "Ingest", "config": {}},
        {"id": "n2", "type": "noop", "label": "Transform", "config": {}},
        {"id": "n3", "type": "noop", "label": "Load", "config": {}},
    ],
    "edges": [
        {"source": "n1", "target": "n2"},
        {"source": "n2", "target": "n3"},
    ],
}

_PARALLEL_WORKFLOW = {
    "name": "Parallel Fan-out",
    "nodes": [
        {"id": "root", "type": "noop", "label": "Root", "config": {}},
        {"id": "branch_a", "type": "noop", "label": "Branch A", "config": {}},
        {"id": "branch_b", "type": "noop", "label": "Branch B", "config": {}},
        {"id": "merge", "type": "noop", "label": "Merge", "config": {}},
    ],
    "edges": [
        {"source": "root", "target": "branch_a"},
        {"source": "root", "target": "branch_b"},
        {"source": "branch_a", "target": "merge"},
        {"source": "branch_b", "target": "merge"},
    ],
}

_CYCLIC_WORKFLOW = {
    "name": "Cyclic",
    "nodes": [
        {"id": "n1", "type": "noop", "label": "A", "config": {}},
        {"id": "n2", "type": "noop", "label": "B", "config": {}},
    ],
    "edges": [
        {"source": "n1", "target": "n2"},
        {"source": "n2", "target": "n1"},
    ],
}

_SELF_LOOP_WORKFLOW = {
    "name": "Self-loop",
    "nodes": [{"id": "n1", "type": "noop", "label": "A", "config": {}}],
    "edges": [{"source": "n1", "target": "n1"}],
}

_DUPLICATE_IDS_WORKFLOW = {
    "name": "Duplicate IDs",
    "nodes": [
        {"id": "n1", "type": "noop", "label": "A", "config": {}},
        {"id": "n1", "type": "noop", "label": "B", "config": {}},
    ],
    "edges": [],
}


@pytest.mark.asyncio
class TestWorkflowCRUD:
    async def test_create_linear_workflow(self, client: AsyncClient):
        r = await client.post("/api/v1/workflows", json=_LINEAR_WORKFLOW)
        assert r.status_code == 201
        body = r.json()
        assert body["name"] == "Linear Pipeline"
        assert "id" in body
        assert "created_at" in body

    async def test_create_parallel_workflow(self, client: AsyncClient):
        r = await client.post("/api/v1/workflows", json=_PARALLEL_WORKFLOW)
        assert r.status_code == 201

    async def test_create_cyclic_workflow_rejected(self, client: AsyncClient):
        r = await client.post("/api/v1/workflows", json=_CYCLIC_WORKFLOW)
        assert r.status_code == 422

    async def test_create_self_loop_rejected(self, client: AsyncClient):
        r = await client.post("/api/v1/workflows", json=_SELF_LOOP_WORKFLOW)
        assert r.status_code == 422

    async def test_create_duplicate_node_ids_rejected(self, client: AsyncClient):
        r = await client.post("/api/v1/workflows", json=_DUPLICATE_IDS_WORKFLOW)
        assert r.status_code == 422

    async def test_create_empty_nodes_rejected(self, client: AsyncClient):
        r = await client.post(
            "/api/v1/workflows",
            json={"name": "Empty", "nodes": [], "edges": []},
        )
        assert r.status_code == 422

    async def test_get_workflow(self, client: AsyncClient):
        cr = await client.post("/api/v1/workflows", json=_LINEAR_WORKFLOW)
        workflow_id = cr.json()["id"]
        r = await client.get(f"/api/v1/workflows/{workflow_id}")
        assert r.status_code == 200
        assert r.json()["id"] == workflow_id

    async def test_get_workflow_not_found(self, client: AsyncClient):
        r = await client.get(
            "/api/v1/workflows/00000000-0000-0000-0000-000000000000"
        )
        assert r.status_code == 404

    async def test_list_workflows(self, client: AsyncClient):
        await client.post("/api/v1/workflows", json=_LINEAR_WORKFLOW)
        r = await client.get("/api/v1/workflows")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    async def test_list_workflows_pagination(self, client: AsyncClient):
        r = await client.get("/api/v1/workflows?limit=1&offset=0")
        assert r.status_code == 200
        assert len(r.json()) <= 1


@pytest.mark.asyncio
class TestWorkflowRuns:
    async def _create_workflow(self, client: AsyncClient) -> str:
        r = await client.post("/api/v1/workflows", json=_LINEAR_WORKFLOW)
        return r.json()["id"]

    async def test_trigger_run_dispatches_task(self, client: AsyncClient):
        workflow_id = await self._create_workflow(client)
        mock_task = MagicMock()
        mock_task.id = "mock-celery-task-id"

        with patch(
            "app.workers.tasks.execute_workflow.apply_async",
            return_value=mock_task,
        ):
            r = await client.post(f"/api/v1/workflows/{workflow_id}/runs")

        assert r.status_code == 202
        body = r.json()
        assert body["status"] == "pending"
        assert "run_id" in body
        assert "message" in body

    async def test_trigger_run_nonexistent_workflow(self, client: AsyncClient):
        r = await client.post(
            "/api/v1/workflows/00000000-0000-0000-0000-000000000000/runs"
        )
        assert r.status_code == 404

    async def test_list_runs_empty(self, client: AsyncClient):
        workflow_id = await self._create_workflow(client)
        r = await client.get(f"/api/v1/workflows/{workflow_id}/runs")
        assert r.status_code == 200
        assert r.json() == []

    async def test_list_runs_nonexistent_workflow(self, client: AsyncClient):
        r = await client.get(
            "/api/v1/workflows/00000000-0000-0000-0000-000000000000/runs"
        )
        assert r.status_code == 404

    async def test_get_run_after_trigger(self, client: AsyncClient):
        workflow_id = await self._create_workflow(client)
        mock_task = MagicMock()
        mock_task.id = "mock-celery-id-2"

        with patch(
            "app.workers.tasks.execute_workflow.apply_async",
            return_value=mock_task,
        ):
            trigger_r = await client.post(f"/api/v1/workflows/{workflow_id}/runs")

        run_id = trigger_r.json()["run_id"]
        r = await client.get(f"/api/v1/runs/{run_id}")
        assert r.status_code == 200
        body = r.json()
        assert body["id"] == run_id
        assert body["workflow_id"] == workflow_id
        assert body["status"] == "pending"
        assert "execution_plan" in body
        assert "node_executions" in body
        assert isinstance(body["execution_plan"], list)

    async def test_get_run_not_found(self, client: AsyncClient):
        r = await client.get("/api/v1/runs/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404

    async def test_execution_plan_reflects_dag_structure(self, client: AsyncClient):
        workflow_id = await self._create_workflow(client)
        mock_task = MagicMock()
        mock_task.id = "mock-celery-id-3"

        with patch(
            "app.workers.tasks.execute_workflow.apply_async",
            return_value=mock_task,
        ):
            trigger_r = await client.post(f"/api/v1/workflows/{workflow_id}/runs")

        run_id = trigger_r.json()["run_id"]
        r = await client.get(f"/api/v1/runs/{run_id}")
        plan = r.json()["execution_plan"]

        assert plan[0] == ["n1"]
        assert plan[1] == ["n2"]
        assert plan[2] == ["n3"]


@pytest.mark.asyncio
class TestHealth:
    async def test_health_check(self, client: AsyncClient):
        r = await client.get("/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}
