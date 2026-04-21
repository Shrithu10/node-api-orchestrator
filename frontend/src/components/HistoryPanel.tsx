import { useEffect, useState, useCallback } from 'react'
import { X, RefreshCw, ChevronRight, CheckCircle2, XCircle, Loader2, Clock4 } from 'lucide-react'
import { listWorkflowRuns, type RunSummary } from '../api/client'

const STATUS_CFG = {
  pending:   { color: 'rgba(155,155,165,0.85)', icon: Clock4 },
  running:   { color: 'rgba(10,132,255,0.9)',   icon: Loader2 },
  completed: { color: 'rgba(48,209,88,0.9)',    icon: CheckCircle2 },
  failed:    { color: 'rgba(255,59,48,0.9)',    icon: XCircle },
} as const

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

  const panelStyle: React.CSSProperties = {
    width: 300,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'rgba(12,12,14,0.97)',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
  }

  return (
    <aside style={panelStyle}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.82)', margin: '0 0 2px' }}>Run History</p>
          {workflowId && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0, fontFamily: 'ui-monospace, monospace' }}>
              {workflowId.slice(0, 8)}…
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={fetchRuns}
            disabled={loading}
            style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.28)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.4 : 1, lineHeight: 0, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)' } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.28)', cursor: 'pointer', lineHeight: 0, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!workflowId && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6, margin: 0 }}>
              Save a workflow first to view its run history
            </p>
          </div>
        )}

        {workflowId && loading && runs.length === 0 && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
        )}

        {workflowId && !loading && error && (
          <div style={{ padding: 16 }}>
            <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,59,48,0.18)', background: 'rgba(255,59,48,0.08)' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,100,90,0.85)', margin: 0 }}>{error}</p>
            </div>
          </div>
        )}

        {workflowId && !loading && !error && runs.length === 0 && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0 }}>No runs yet for this workflow</p>
          </div>
        )}

        {runs.length > 0 && (
          <div>
            {runs.map((run, idx) => {
              const cfg = STATUS_CFG[run.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
              const Icon = cfg.icon
              return (
                <button
                  key={run.id}
                  onClick={() => onSelectRun(run.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: idx < runs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <Icon
                    size={14}
                    style={{ color: cfg.color, flexShrink: 0 }}
                    className={run.status === 'running' ? 'animate-spin' : ''}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 550, color: cfg.color, textTransform: 'capitalize' }}>{run.status}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>{dur(run.started_at, run.completed_at)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '3px 0 0', fontFamily: 'ui-monospace, monospace' }}>
                      {run.id.slice(0, 8)}…
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '2px 0 0' }}>
                      {fmtDate(run.created_at)}
                    </p>
                    {run.execution_plan.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                        {run.execution_plan.map((level, i) => (
                          <span key={i} style={{
                            fontSize: 10, padding: '1px 5px', borderRadius: 4,
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.04)',
                            color: 'rgba(255,255,255,0.35)',
                          }}>{level.length}</span>
                        ))}
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>nodes/lvl</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', margin: 0 }}>Click any run to inspect its execution</p>
      </div>
    </aside>
  )
}
