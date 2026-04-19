import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflowstatus') THEN
                CREATE TYPE workflowstatus AS ENUM ('pending', 'running', 'completed', 'failed');
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nodestatus') THEN
                CREATE TYPE nodestatus AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');
            END IF;
        END $$;
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS workflows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            definition JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS workflow_runs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
            status workflowstatus NOT NULL DEFAULT 'pending',
            execution_plan JSONB NOT NULL,
            workflow_snapshot JSONB NOT NULL,
            celery_task_id VARCHAR(255),
            error_message TEXT,
            started_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS node_executions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
            node_id VARCHAR(255) NOT NULL,
            node_type VARCHAR(100) NOT NULL,
            status nodestatus NOT NULL DEFAULT 'pending',
            input_data JSONB,
            output_data JSONB,
            error_message TEXT,
            started_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_workflow_runs_workflow_id ON workflow_runs(workflow_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_workflow_runs_status ON workflow_runs(status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_workflow_runs_created_at ON workflow_runs(created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_node_executions_run_id ON node_executions(run_id)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_node_executions_run_node ON node_executions(run_id, node_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_node_executions_status ON node_executions(status)")


def downgrade() -> None:
    op.drop_table("node_executions")
    op.drop_table("workflow_runs")
    op.drop_table("workflows")
    op.execute("DROP TYPE nodestatus")
    op.execute("DROP TYPE workflowstatus")
