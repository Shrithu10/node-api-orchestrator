import { useEffect, useState, useCallback } from 'react'
import { X, RefreshCw, ChevronRight, CheckCircle2, XCircle, Loader2, Clock4 } from 'lucide-react'
import { listWorkflowRuns, type RunSummary } from '../api/client'
import { useTheme } from '../hooks/useTheme'
import type { RunStatus } from '../types'

const STATUS_ICONS: Record<string, typeof Clock4> = {
  pending: Clock4, running: Loader2, completed: CheckCircle2, failed: XCircle,
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function dur(start: string | null, end: string | null) {
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
  const t = useTheme()
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRuns = useCallback(async () => {
    if (!workflowId) return
    setLoading(true)
    setError(null)
    try {
      setRuns(await listWorkflowRuns(workflowId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load runs')
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  useEffect(() => { fetchRuns() }, [fetchRuns])

  const iconBtn = (onClick: () => void, icon: React.ReactNode, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ padding: 7, borderRadius: 8, border: 'none', background: 'transparent', color: t.iconDefault, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, lineHeight: 0, transition: 'all 0.15s' }}
      onMouseEnter={(e) => { if (!disabled) { const el = e.currentTarget as HTMLElement; el.style.background = t.btnHoverBg; el.style.color = t.btnHoverColor } }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = t.iconDefault }}
    >
      {icon}
    </button>
  )

  return (
    <aside style={{
      width: 300, flexShrink: 0,
      display: 'flex', flexDirection: 'column', height: '100%',
      background: t.panelBg,
      borderLeft: `1px solid ${t.panelBorder}`,
      boxShadow: t.panelShadow,
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 12px', borderBottom: `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 450, color: t.textPrimary, margin: '0 0 2px' }}>Run History</p>
          {workflowId && (
            <p style={{ fontSize: 11, color: t.textMuted, margin: 0, fontFamily: 'ui-monospace,monospace' }}>
              {workflowId.slice(0, 8)}…
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {iconBtn(fetchRuns, <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />, loading)}
          {iconBtn(onClose, <X size={14} />)}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!workflowId && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: t.textTertiary, lineHeight: 1.6, margin: 0 }}>
              Save a workflow first to view its run history
            </p>
          </div>
        )}

        {workflowId && loading && runs.length === 0 && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: t.textMuted }} />
          </div>
        )}

        {workflowId && !loading && error && (
          <div style={{ padding: 14 }}>
            <div style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${t.errorBorder}`, background: t.errorBg }}>
              <p style={{ fontSize: 12, color: t.errorColor, margin: 0 }}>{error}</p>
            </div>
          </div>
        )}

        {workflowId && !loading && !error && runs.length === 0 && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <p style={{ fontSize: 13, color: t.textTertiary, margin: 0 }}>No runs yet for this workflow</p>
          </div>
        )}

        {runs.length > 0 && runs.map((run, idx) => {
          const status = run.status as RunStatus
          const statusCfg = { pending: t.statusPending, running: t.statusRunning, completed: t.statusCompleted, failed: t.statusFailed }[status] ?? t.statusPending
          const Icon = STATUS_ICONS[run.status] ?? Clock4

          return (
            <button
              key={run.id}
              onClick={() => onSelectRun(run.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'transparent', border: 'none',
                borderBottom: idx < runs.length - 1 ? `1px solid ${t.divider}` : 'none',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = t.listItemHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <Icon
                size={14}
                style={{ color: statusCfg.color, flexShrink: 0 }}
                className={run.status === 'running' ? 'animate-spin' : ''}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 450, color: statusCfg.color, textTransform: 'capitalize' }}>{run.status}</span>
                  <span style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}>{dur(run.started_at, run.completed_at)}</span>
                </div>
                <p style={{ fontSize: 11, color: t.textTertiary, margin: '3px 0 0', fontFamily: 'ui-monospace,monospace' }}>
                  {run.id.slice(0, 8)}…
                </p>
                <p style={{ fontSize: 11, color: t.textMuted, margin: '2px 0 0' }}>
                  {fmtDate(run.created_at)}
                </p>
                {run.execution_plan.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                    {run.execution_plan.map((level, i) => (
                      <span key={i} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, border: `1px solid ${t.cardBorder}`, background: t.cardBg, color: t.textTertiary }}>
                        {level.length}
                      </span>
                    ))}
                    <span style={{ fontSize: 10, color: t.textMuted }}>nodes/lvl</span>
                  </div>
                )}
              </div>
              <ChevronRight size={13} style={{ color: t.textMuted, flexShrink: 0 }} />
            </button>
          )
        })}
      </div>

      <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.divider}`, flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: t.textMuted, margin: 0 }}>Click any run to inspect its execution</p>
      </div>
    </aside>
  )
}
