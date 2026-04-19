import { X, CheckCircle2, XCircle, Loader2, Clock4, Circle } from 'lucide-react'
import type { NodeExecStatus, RunDetail, RunStatus } from '../types'
import { NODE_COLOR } from '../constants/nodeTypes'
import type { NodeType } from '../types'

const STATUS_CONFIG: Record<
  RunStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  pending: { label: 'Pending', color: '#6b7280', icon: Clock4 },
  running: { label: 'Running', color: '#3b82f6', icon: Loader2 },
  completed: { label: 'Completed', color: '#22c55e', icon: CheckCircle2 },
  failed: { label: 'Failed', color: '#ef4444', icon: XCircle },
}

const NODE_STATUS_CONFIG: Record<
  NodeExecStatus,
  { color: string; icon: typeof Circle }
> = {
  pending: { color: '#6b7280', icon: Circle },
  running: { color: '#3b82f6', icon: Loader2 },
  completed: { color: '#22c55e', icon: CheckCircle2 },
  failed: { color: '#ef4444', icon: XCircle },
  skipped: { color: '#a855f7', icon: Circle },
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '—'
  const ms = new Date(end ?? new Date().toISOString()).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString()
}

interface RunStatusPanelProps {
  runDetail: RunDetail | null
  isPolling: boolean
  onClose: () => void
}

export function RunStatusPanel({ runDetail, isPolling, onClose }: RunStatusPanelProps) {
  const status = runDetail?.status ?? 'pending'
  const cfg = STATUS_CONFIG[status]
  const StatusIcon = cfg.icon

  return (
    <aside className="flex h-full w-80 flex-shrink-0 flex-col border-l border-white/5 bg-[#12131c]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusIcon
            size={14}
            style={{ color: cfg.color }}
            className={status === 'running' ? 'animate-spin' : ''}
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
              Execution Run
            </p>
            <p style={{ color: cfg.color }} className="text-sm font-semibold">
              {cfg.label}
              {isPolling && status === 'running' && (
                <span className="ml-1 text-[10px] text-white/30">polling…</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-white/60"
        >
          <X size={13} />
        </button>
      </div>

      {!runDetail && (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 size={24} className="animate-spin text-white/20" />
            <p className="text-sm text-white/30">Waiting for execution data…</p>
          </div>
        </div>
      )}

      {runDetail && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Run ID', value: runDetail.id.slice(0, 8) + '…' },
              { label: 'Duration', value: formatDuration(runDetail.started_at, runDetail.completed_at) },
              { label: 'Started', value: formatTime(runDetail.started_at) },
              { label: 'Finished', value: formatTime(runDetail.completed_at) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-2"
              >
                <p className="text-[10px] text-white/30">{stat.label}</p>
                <p className="mt-0.5 text-xs font-medium text-white/70">{stat.value}</p>
              </div>
            ))}
          </div>

          {runDetail.error_message && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                Error
              </p>
              <p className="mt-1 break-words text-xs text-red-300/80">{runDetail.error_message}</p>
            </div>
          )}

          {runDetail.execution_plan.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Execution Plan
              </p>
              <div className="space-y-1.5">
                {runDetail.execution_plan.map((level, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="min-w-[18px] text-center text-[10px] font-bold text-white/20">
                      {i + 1}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {level.map((nodeId) => (
                        <span
                          key={nodeId}
                          className="rounded border border-white/8 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/50"
                        >
                          {nodeId}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {runDetail.node_executions.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Node Executions
              </p>
              <div className="space-y-2">
                {runDetail.node_executions.map((ne) => {
                  const nCfg = NODE_STATUS_CONFIG[ne.status]
                  const NodeIcon = nCfg.icon
                  const nodeColor = NODE_COLOR[ne.node_type as NodeType] ?? '#6b7280'
                  return (
                    <div
                      key={ne.id}
                      className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            style={{ background: `${nodeColor}20`, color: nodeColor }}
                            className="flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                          >
                            {ne.node_type}
                          </span>
                          <span className="truncate font-mono text-[10px] text-white/50">
                            {ne.node_id}
                          </span>
                        </div>
                        <NodeIcon
                          size={12}
                          style={{ color: nCfg.color }}
                          className={`flex-shrink-0 ${ne.status === 'running' ? 'animate-spin' : ''}`}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-white/30">
                        <span>{formatDuration(ne.started_at, ne.completed_at)}</span>
                        <span style={{ color: nCfg.color }} className="font-medium capitalize">
                          {ne.status}
                        </span>
                      </div>
                      {ne.error_message && (
                        <p className="mt-1.5 break-words text-[10px] text-red-300/70">
                          {ne.error_message}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
