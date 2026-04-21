import { X, CheckCircle2, XCircle, Loader2, Clock4, Circle } from 'lucide-react'
import type { NodeExecStatus, RunDetail, RunStatus } from '../types'
import { NODE_COLOR } from '../constants/nodeTypes'
import type { NodeType } from '../types'

const STATUS_CONFIG: Record<RunStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pending:   { label: 'Pending',   color: 'rgba(160,160,170,0.85)', bg: 'rgba(120,120,130,0.1)',  icon: Clock4 },
  running:   { label: 'Running',   color: 'rgba(10,132,255,0.95)',  bg: 'rgba(10,132,255,0.1)',   icon: Loader2 },
  completed: { label: 'Completed', color: 'rgba(48,209,88,0.95)',   bg: 'rgba(48,209,88,0.1)',    icon: CheckCircle2 },
  failed:    { label: 'Failed',    color: 'rgba(255,59,48,0.95)',   bg: 'rgba(255,59,48,0.1)',    icon: XCircle },
}

const NODE_STATUS: Record<NodeExecStatus, { color: string; icon: typeof Circle }> = {
  pending:   { color: 'rgba(150,150,160,0.8)', icon: Circle },
  running:   { color: 'rgba(10,132,255,0.9)',  icon: Loader2 },
  completed: { color: 'rgba(48,209,88,0.9)',   icon: CheckCircle2 },
  failed:    { color: 'rgba(255,59,48,0.9)',   icon: XCircle },
  skipped:   { color: 'rgba(175,82,222,0.8)',  icon: Circle },
}

function dur(start: string | null, end: string | null) {
  if (!start) return '—'
  const ms = new Date(end ?? new Date().toISOString()).getTime() - new Date(start).getTime()
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}
function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const panelStyle: React.CSSProperties = {
  width: 300,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'rgba(12,12,14,0.97)',
  borderLeft: '1px solid rgba(255,255,255,0.06)',
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.28)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 8,
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
    <aside style={panelStyle}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <StatusIcon size={15} style={{ color: cfg.color }} className={status === 'running' ? 'animate-spin' : ''} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', fontWeight: 500 }}>Execution Run</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: cfg.color, margin: 0 }}>
              {cfg.label}
              {isPolling && status === 'running' && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 400, marginLeft: 6 }}>live</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.28)', cursor: 'pointer', lineHeight: 0, transition: 'all 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)' }}
        >
          <X size={14} />
        </button>
      </div>

      {!runDetail && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Loader2 size={22} className="animate-spin" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', margin: 0 }}>Waiting for execution data…</p>
        </div>
      )}

      {runDetail && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Run ID', value: runDetail.id.slice(0, 8) + '…' },
              { label: 'Duration', value: dur(runDetail.started_at, runDetail.completed_at) },
              { label: 'Started', value: fmt(runDetail.started_at) },
              { label: 'Finished', value: fmt(runDetail.completed_at) },
            ].map((s) => (
              <div key={s.label} style={{ padding: '9px 11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 3px', fontWeight: 500 }}>{s.label}</p>
                <p style={{ fontSize: 12, fontWeight: 550, color: 'rgba(255,255,255,0.72)', margin: 0, fontFamily: s.label === 'Run ID' ? 'ui-monospace, monospace' : 'inherit' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Error */}
          {runDetail.error_message && (
            <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,59,48,0.18)', background: 'rgba(255,59,48,0.08)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,80,70,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>Error</p>
              <p style={{ fontSize: 12, color: 'rgba(255,100,90,0.8)', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{runDetail.error_message}</p>
            </div>
          )}

          {/* Execution plan */}
          {runDetail.execution_plan.length > 0 && (
            <div>
              <p style={sectionLabel}>Execution Plan</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {runDetail.execution_plan.map((level, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.18)', minWidth: 16, paddingTop: 3 }}>{i + 1}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {level.map((nodeId) => (
                        <span key={nodeId} style={{
                          padding: '2px 7px', borderRadius: 5,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.04)',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 10, color: 'rgba(255,255,255,0.45)',
                        }}>{nodeId}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Node executions */}
          {runDetail.node_executions.length > 0 && (
            <div>
              <p style={sectionLabel}>Node Executions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {runDetail.node_executions.map((ne) => {
                  const nCfg = NODE_STATUS[ne.status]
                  const NodeIcon = nCfg.icon
                  const nodeColor = NODE_COLOR[ne.node_type as NodeType] ?? 'rgba(150,150,160,0.8)'
                  return (
                    <div key={ne.id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{
                            padding: '2px 7px', borderRadius: 5, flexShrink: 0,
                            background: `${nodeColor}18`, border: `1px solid ${nodeColor}28`,
                            color: nodeColor, fontSize: 9, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                          }}>{ne.node_type}</span>
                          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ne.node_id.slice(0, 14)}…
                          </span>
                        </div>
                        <NodeIcon size={13} style={{ color: nCfg.color, flexShrink: 0 }} className={ne.status === 'running' ? 'animate-spin' : ''} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 7 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>{dur(ne.started_at, ne.completed_at)}</span>
                        <span style={{ fontSize: 11, color: nCfg.color, fontWeight: 550, textTransform: 'capitalize' }}>{ne.status}</span>
                      </div>
                      {ne.error_message && (
                        <p style={{ fontSize: 11, color: 'rgba(255,80,70,0.75)', marginTop: 6, lineHeight: 1.5, wordBreak: 'break-word' }}>{ne.error_message}</p>
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
