import { X, CheckCircle2, XCircle, Loader2, Clock4, Circle } from 'lucide-react'
import type { NodeExecStatus, RunDetail, RunStatus } from '../types'
import { NODE_COLOR } from '../constants/nodeTypes'
import { useTheme } from '../hooks/useTheme'
import type { NodeType } from '../types'

function dur(s: string | null, e: string | null) {
  if (!s) return '—'
  const ms = new Date(e ?? new Date().toISOString()).getTime() - new Date(s).getTime()
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}
function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const STATUS_ICONS: Record<RunStatus, typeof CheckCircle2> = {
  pending: Clock4, running: Loader2, completed: CheckCircle2, failed: XCircle,
}
const NODE_ICONS: Record<NodeExecStatus, typeof Circle> = {
  pending: Circle, running: Loader2, completed: CheckCircle2, failed: XCircle, skipped: Circle,
}

export function RunStatusPanel({ runDetail, isPolling, onClose }: { runDetail: RunDetail | null; isPolling: boolean; onClose: () => void }) {
  const t = useTheme()
  const status = (runDetail?.status ?? 'pending') as RunStatus
  const sc = { pending: t.statusPending, running: t.statusRunning, completed: t.statusCompleted, failed: t.statusFailed }[status]
  const StatusIcon = STATUS_ICONS[status]

  const label = (text: string): React.CSSProperties => ({
    fontSize: 10, fontWeight: 500, color: t.sectionLabel,
    textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px',
  })

  const iconBtnStyle: React.CSSProperties = {
    padding: 7, borderRadius: 8, border: 'none',
    background: 'transparent', color: t.iconDefault,
    cursor: 'pointer', lineHeight: 0, transition: 'all 0.15s',
  }

  return (
    <aside style={{
      width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%',
      background: t.panelBg, borderLeft: `1px solid ${t.panelBorder}`,
      boxShadow: t.panelShadow, transition: 'background 0.3s, border-color 0.3s',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 14px', borderBottom: `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: sc.bg, border: `1px solid ${sc.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <StatusIcon size={17} style={{ color: sc.color }} className={status === 'running' ? 'animate-spin' : ''} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: t.textTertiary, margin: '0 0 2px', fontWeight: 500 }}>Execution Run</p>
            <p style={{ fontSize: 15, fontWeight: 500, color: sc.color, margin: 0, letterSpacing: '-0.01em' }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {isPolling && status === 'running' && (
                <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 400, marginLeft: 8 }}>● live</span>
              )}
            </p>
          </div>
        </div>
        <button style={iconBtnStyle}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = t.btnHoverBg; el.style.color = t.btnHoverColor }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = t.iconDefault }}
          onClick={onClose}><X size={15} /></button>
      </div>

      {!runDetail && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: t.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={22} className="animate-spin" style={{ color: t.accent }} />
          </div>
          <p style={{ fontSize: 13, color: t.textTertiary, margin: 0 }}>Waiting for execution data…</p>
        </div>
      )}

      {runDetail && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Run ID', value: runDetail.id.slice(0, 8) + '…', mono: true },
              { label: 'Duration', value: dur(runDetail.started_at, runDetail.completed_at) },
              { label: 'Started', value: fmt(runDetail.started_at) },
              { label: 'Finished', value: fmt(runDetail.completed_at) },
            ].map((s) => (
              <div key={s.label} style={{ padding: '10px 12px', borderRadius: 11, border: `1px solid ${t.cardBorder}`, background: t.cardBg }}>
                <p style={{ fontSize: 10, color: t.textMuted, margin: '0 0 4px', fontWeight: 450, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <p style={{ fontSize: 13, fontWeight: 450, color: t.textSecondary, margin: 0, fontFamily: s.mono ? 'ui-monospace,monospace' : 'inherit' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Error */}
          {runDetail.error_message && (
            <div style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${t.errorBorder}`, background: t.errorBg }}>
              <p style={{ fontSize: 10, fontWeight: 500, color: t.errorColor, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Error</p>
              <p style={{ fontSize: 12, color: t.errorColor, margin: 0, lineHeight: 1.6, wordBreak: 'break-word', opacity: 0.85 }}>{runDetail.error_message}</p>
            </div>
          )}

          {/* Execution plan */}
          {runDetail.execution_plan.length > 0 && (
            <div>
              <p style={label('Execution Plan')}>Execution Plan</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {runDetail.execution_plan.map((level, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 500, color: t.accent, opacity: 0.7, minWidth: 18, paddingTop: 4, textAlign: 'center' }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {level.map((nodeId) => (
                        <span key={nodeId} style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${t.cardBorder}`, background: t.cardBg, fontFamily: 'ui-monospace,monospace', fontSize: 10, color: t.textSecondary }}>
                          {nodeId}
                        </span>
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
              <p style={label('Node Executions')}>Node Executions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {runDetail.node_executions.map((ne) => {
                  const nStatus = ne.status as NodeExecStatus
                  const nCfg = { pending: t.statusPending, running: t.statusRunning, completed: t.statusCompleted, failed: t.statusFailed, skipped: t.statusPending }[nStatus]
                  const NodeIcon = NODE_ICONS[nStatus]
                  const nodeColor = NODE_COLOR[ne.node_type as NodeType] ?? t.textTertiary
                  return (
                    <div key={ne.id} style={{ padding: '11px 13px', borderRadius: 12, border: `1px solid ${t.cardBorder}`, background: t.cardBg }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 6, background: `${nodeColor}18`, border: `1px solid ${nodeColor}30`, color: nodeColor, fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                            {ne.node_type}
                          </span>
                          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: t.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ne.node_id.slice(0, 16)}
                          </span>
                        </div>
                        <NodeIcon size={14} style={{ color: nCfg.color, flexShrink: 0 }} className={nStatus === 'running' ? 'animate-spin' : ''} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: t.textMuted }}>{dur(ne.started_at, ne.completed_at)}</span>
                        <span style={{ fontSize: 11, color: nCfg.color, fontWeight: 450, textTransform: 'capitalize' }}>{ne.status}</span>
                      </div>
                      {ne.error_message && (
                        <p style={{ fontSize: 11, color: t.errorColor, marginTop: 7, lineHeight: 1.5, wordBreak: 'break-word', opacity: 0.9 }}>{ne.error_message}</p>
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
