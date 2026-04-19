import { useEffect, useState, useCallback } from 'react'
import { X, RefreshCw, ChevronRight, CheckCircle2, XCircle, Loader2, Clock4 } from 'lucide-react'
import { listWorkflowRuns, type RunSummary } from '../api/client'
import type { RunStatus } from '../types'

const STATUS_COLOR: Record<string, string> = {
  pending: '#6b7280',
  running: '#3b82f6',
  completed: '#22c55e',
  failed: '#ef4444',
}

const STATUS_ICON: Record<string, typeof Clock4> = {
  pending: Clock4,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function duration(start: string | null, end: string | null): string {
  if (!start) return '—'
  const ms = new Date(end ?? new Date().toISOString()).getTime() - new Date(start).getTime()
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

interface HistoryPanelProps {
  workflowId: string | null
  onSelectRun: (runId: string) => void
  onClose: () => void
}

export function HistoryPanel({ workflowId, onSelectRun, onClose }: HistoryPanelProps) {
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRuns = useCallback(async () => {
    if (!workflowId) return
    setLoading(true)
    setError(null)
    try {
      const data = await listWorkflowRuns(workflowId)
      setRuns(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load runs')
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  useEffect(() => {
    fetchRuns()
  }, [fetchRuns])

  return (
    <aside className="flex h-full w-80 flex-shrink-0 flex-col border-l border-white/5 bg-[#12131c]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
            Run History
          </p>
          {workflowId && (
            <p className="mt-0.5 font-mono text-[10px] text-white/20">
              {workflowId.slice(0, 8)}…
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchRuns}
            disabled={loading}
            className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-white/60 disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-white/60"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!workflowId && (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p className="text-sm text-white/25">
              Save a workflow first to view its run history
            </p>
          </div>
        )}

        {workflowId && loading && runs.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        )}

        {workflowId && !loading && error && (
          <div className="p-4">
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          </div>
        )}

        {workflowId && !loading && !error && runs.length === 0 && (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p className="text-sm text-white/25">No runs yet for this workflow</p>
          </div>
        )}

        {runs.length > 0 && (
          <div className="divide-y divide-white/[0.04]">
            {runs.map((run) => {
              const color = STATUS_COLOR[run.status] ?? '#6b7280'
              const Icon = STATUS_ICON[run.status] ?? Clock4
              return (
                <button
                  key={run.id}
                  onClick={() => onSelectRun(run.id)}
                  className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
                >
                  <Icon
                    size={14}
                    style={{ color }}
                    className={`flex-shrink-0 ${run.status === 'running' ? 'animate-spin' : ''}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        style={{ color }}
                        className="text-xs font-semibold capitalize"
                      >
                        {run.status}
                      </span>
                      <span className="text-[10px] text-white/25">
                        {duration(run.started_at, run.completed_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-white/30">
                      {run.id.slice(0, 8)}…
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/20">
                      {formatDate(run.created_at)}
                    </p>
                    {run.execution_plan.length > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        {run.execution_plan.map((level, i) => (
                          <span
                            key={i}
                            className="rounded border border-white/8 bg-white/5 px-1 py-0.5 text-[9px] text-white/30"
                          >
                            {level.length}
                          </span>
                        ))}
                        <span className="text-[9px] text-white/15">nodes/level</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    size={12}
                    className="flex-shrink-0 text-white/15 transition group-hover:text-white/40"
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-white/5 px-4 py-2.5">
        <p className="text-[10px] text-white/15">
          Click any run to view full execution detail
        </p>
      </div>
    </aside>
  )
}
