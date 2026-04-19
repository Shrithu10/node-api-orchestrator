import axios, { type AxiosError } from 'axios'
import type { RunDetail, WorkflowPayload } from '../types'

const http = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const detail = (err.response?.data as { detail?: string })?.detail
    return Promise.reject(new Error(detail ?? err.message))
  },
)

export interface WorkflowResponse {
  id: string
  name: string
  created_at: string
}

export interface TriggerRunResponse {
  run_id: string
  status: string
  message: string
}

export async function createWorkflow(payload: WorkflowPayload): Promise<WorkflowResponse> {
  const { data } = await http.post<WorkflowResponse>('/api/v1/workflows', payload)
  return data
}

export async function triggerRun(workflowId: string): Promise<TriggerRunResponse> {
  const { data } = await http.post<TriggerRunResponse>(`/api/v1/workflows/${workflowId}/runs`)
  return data
}

export async function getRunDetail(runId: string): Promise<RunDetail> {
  const { data } = await http.get<RunDetail>(`/api/v1/runs/${runId}`)
  return data
}

export async function listWorkflows(): Promise<WorkflowResponse[]> {
  const { data } = await http.get<WorkflowResponse[]>('/api/v1/workflows')
  return data
}

export interface RunSummary {
  id: string
  workflow_id: string
  status: string
  execution_plan: string[][]
  celery_task_id: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export async function listWorkflowRuns(workflowId: string): Promise<RunSummary[]> {
  const { data } = await http.get<RunSummary[]>(`/api/v1/workflows/${workflowId}/runs`)
  return data
}
