export type NodeType =
  | 'http_request'
  | 'transform'
  | 'filter'
  | 'merge'
  | 'delay'
  | 'noop'

export interface NodeConfig {
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, string>
  timeout?: number
  source_node?: string
  mappings?: Record<string, string>
  field?: string
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startswith'
  value?: unknown
  strategy?: 'shallow' | 'deep'
  seconds?: number
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string
  nodeType: NodeType
  config: NodeConfig
}

export interface BackendNode {
  id: string
  type: NodeType
  label: string
  config: NodeConfig
}

export interface BackendEdge {
  source: string
  target: string
}

export interface WorkflowPayload {
  name: string
  nodes: BackendNode[]
  edges: BackendEdge[]
}

export interface NodeTypeDefinition {
  type: NodeType
  label: string
  description: string
  color: string
  defaultConfig: NodeConfig
}

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed'
export type NodeExecStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface NodeExecutionDetail {
  id: string
  node_id: string
  node_type: string
  status: NodeExecStatus
  output_data: Record<string, unknown> | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
}

export interface RunDetail {
  id: string
  workflow_id: string
  status: RunStatus
  execution_plan: string[][]
  node_executions: NodeExecutionDetail[]
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
}
