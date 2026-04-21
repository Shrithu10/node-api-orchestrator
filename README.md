# Node-Based API Orchestrator

A visual workflow engine for building and running distributed API pipelines — drag nodes onto a canvas, wire them together, hit run, and watch each step execute in parallel across a Celery worker cluster.

---

## Why I Built This

Most API integration tools are either too rigid (fixed linear flows) or too complex (full enterprise iPaaS platforms with vendor lock-in). I wanted something in between — a lightweight engine where you can visually compose API calls, transformations, and filters into a real DAG, then dispatch it to actual distributed workers.

The deeper motivation was to understand how orchestration systems like Airflow and Temporal work under the hood: how do you represent a graph of work, detect cycles, schedule parallel levels, and track granular state for every node in a run? Building it from scratch was the fastest way to find out.

---

## What It Does

- **Visual canvas** — drag and drop node types onto a React Flow canvas, connect them with edges to define data dependencies
- **DAG engine** — the backend parses your graph using Kahn's BFS topological sort, detects cycles, and computes execution levels (nodes in the same level run in parallel)
- **Distributed execution** — each level becomes a Celery `group`, levels are chained with `chain()`, so independent nodes run concurrently across workers
- **Granular state tracking** — every node execution is recorded in Postgres with its own status, input/output data, timing, and error message
- **Run history** — browse all past runs for a workflow, click any run to replay its full execution detail
- **Live polling** — the UI polls the run status every 2.5 seconds and updates node statuses in real time until the run completes or fails

---

## Node Types

| Node | What it does |
|---|---|
| `http_request` | Makes an HTTP call (GET/POST/PUT/DELETE/PATCH) with configurable headers, body, and timeout |
| `transform` | Remaps fields from a source node's output using a JSON mapping spec |
| `filter` | Conditionally passes or skips based on a field comparison (eq, gt, contains, etc.) |
| `merge` | Combines outputs from multiple upstream nodes (shallow or deep merge) |
| `delay` | Waits N seconds — useful for rate limiting or sequencing |
| `noop` | Pass-through, useful for branching or testing graph structure |

---

## Architecture

```
Browser (React + React Flow)
        │
        │  POST /api/v1/workflows        — save workflow definition
        │  POST /api/v1/workflows/{id}/runs  — trigger a run
        │  GET  /api/v1/runs/{id}        — poll run + node statuses
        ▼
FastAPI (async, uvicorn)
        │
        │  topological sort → execution plan (list of levels)
        │  WorkflowRun created in Postgres (status: pending)
        ▼
Celery worker (chain of groups)
        │
        │  level 0: group(node_a, node_b)  ← parallel
        │  level 1: group(node_c)
        │  level 2: group(node_d, node_e)  ← parallel
        │  finalize: mark run completed/failed
        ▼
Postgres (workflow_runs + node_executions tables)
Redis (Celery broker + result backend)
```

Key design choices:
- `workflow_snapshot` is denormalized onto `WorkflowRun` so Celery workers never need to JOIN back to the workflows table
- SQLAlchemy uses `lazy="raise"` on all relationships to prevent accidental N+1 queries in async context
- Alembic migrations are fully idempotent (`DO $$ IF NOT EXISTS $$` for enums, `CREATE TABLE IF NOT EXISTS` for tables) so the API container can restart without migration failures

---

## Stack

**Backend**
- Python, FastAPI, Pydantic v2
- SQLAlchemy 2.0 (async via asyncpg, sync via psycopg2 for Celery)
- Celery 5 + Redis
- PostgreSQL 16
- Alembic

**Frontend**
- React + Vite + TypeScript
- @xyflow/react (React Flow v12)
- Zustand
- Tailwind CSS v4
- Axios

**Infrastructure**
- Docker + Docker Compose

---

## Running Locally

**Prerequisites:** Docker and Docker Compose

```bash
git clone https://github.com/Shrithu10/node-api-orchestrator.git
cd node-api-orchestrator

cp .env.example .env

docker compose up -d
```

The app will be available at `http://localhost:5173`  
API docs at `http://localhost:8000/docs`

---

## Project Structure

```
.
├── app/
│   ├── api/v1/endpoints.py     # FastAPI route handlers
│   ├── core/dag.py             # Kahn's BFS topological sort
│   ├── models/orm.py           # SQLAlchemy ORM models
│   ├── repositories/run.py     # DB read/write layer
│   ├── services/workflow.py    # Orchestration logic
│   └── workers/
│       ├── tasks.py            # Celery task definitions
│       └── executors.py        # Per-node-type execution logic
├── alembic/                    # DB migrations
├── frontend/
│   └── src/
│       ├── components/         # React components (canvas, panels, nodes)
│       ├── store/              # Zustand store
│       ├── hooks/              # useRunPoller
│       └── api/client.ts       # Axios API client
├── docker-compose.yml
└── Dockerfile
```
