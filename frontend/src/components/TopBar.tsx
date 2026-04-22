import { useState } from 'react'
import { Play, Save, Loader2, Clock, Sun, Moon, X, CheckCircle } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'
import { createWorkflow, triggerRun } from '../api/client'
import { useTheme } from '../hooks/useTheme'

type RunState = 'idle' | 'saving' | 'triggering' | 'dispatched' | 'error'

interface TopBarProps {
  onRunDispatched: (runId: string) => void
  onToggleHistory: () => void
  showHistory: boolean
}

export function TopBar({ onRunDispatched, onToggleHistory, showHistory }: TopBarProps) {
  const workflowName = useWorkflowStore((s) => s.workflowName)
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName)
  const setSavedWorkflowId = useWorkflowStore((s) => s.setSavedWorkflowId)
  const toBackendPayload = useWorkflowStore((s) => s.toBackendPayload)
  const nodes = useWorkflowStore((s) => s.nodes)
  const toggleTheme = useWorkflowStore((s) => s.toggleTheme)
  const t = useTheme()
  const isLight = t.theme === 'light'

  const [runState, setRunState] = useState<RunState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const run = async (withRun: boolean) => {
    if (nodes.length === 0) {
      setErrorMsg('Add at least one node first')
      setRunState('error')
      setTimeout(() => setRunState('idle'), 3000)
      return
    }
    setRunState('saving')
    setErrorMsg('')
    try {
      const workflow = await createWorkflow(toBackendPayload())
      setSavedWorkflowId(workflow.id)
      if (!withRun) { setRunState('dispatched'); setTimeout(() => setRunState('idle'), 1800); return }
      setRunState('triggering')
      const r = await triggerRun(workflow.id)
      setRunState('dispatched')
      onRunDispatched(r.run_id)
      setTimeout(() => setRunState('idle'), 2000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setRunState('error')
      setTimeout(() => setRunState('idle'), 4000)
    }
  }

  const isBusy = runState === 'saving' || runState === 'triggering'

  return (
    <header style={{
      display: 'flex', height: 56, flexShrink: 0,
      alignItems: 'center', padding: '0 20px', gap: 12,
      background: t.topbarBg,
      borderBottom: `1px solid ${t.topbarBorder}`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      transition: 'background 0.3s, border-color 0.3s',
      position: 'relative', zIndex: 20,
      boxShadow: isLight ? '0 1px 16px rgba(0,0,0,0.07)' : '0 1px 0 rgba(255,255,255,0.04)',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(145deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(139,92,246,0.45)',
          flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="3" cy="7.5" r="2.2" fill="white" fillOpacity="0.95"/>
            <circle cx="12" cy="3" r="2.2" fill="white" fillOpacity="0.95"/>
            <circle cx="12" cy="12" r="2.2" fill="white" fillOpacity="0.95"/>
            <line x1="5.1" y1="6.5" x2="9.9" y2="4" stroke="white" strokeWidth="1.1" strokeOpacity="0.6"/>
            <line x1="5.1" y1="8.5" x2="9.9" y2="11" stroke="white" strokeWidth="1.1" strokeOpacity="0.6"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary, margin: 0, letterSpacing: '-0.03em' }}>
            Orchestrator
          </p>
          <p style={{ fontSize: 10, color: t.textMuted, margin: 0, letterSpacing: '0.02em', fontWeight: 500 }}>
            API workflow engine
          </p>
        </div>
      </div>

      <div style={{ width: 1, height: 24, background: t.divider, margin: '0 2px', flexShrink: 0 }} />

      {/* Name */}
      <input
        type="text" value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        placeholder="Untitled workflow"
        style={{
          background: 'transparent', border: 'none', outline: 'none',
          color: t.textPrimary, fontSize: 14, fontWeight: 450,
          width: 200, padding: '6px 10px', borderRadius: 9,
          transition: 'background 0.15s', fontFamily: 'inherit',
          letterSpacing: '-0.01em',
        }}
        onFocus={(e) => { e.target.style.background = t.inputBg }}
        onBlur={(e) => { e.target.style.background = 'transparent' }}
      />

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>

        {runState === 'error' && (
          <div className="animate-in" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: t.errorBg, border: `1px solid ${t.errorBorder}`,
            borderRadius: 10, padding: '6px 12px',
          }}>
            <span style={{ fontSize: 12, color: t.errorColor, fontWeight: 500 }}>{errorMsg}</span>
            <button onClick={() => setRunState('idle')} style={{ color: t.errorColor, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0, opacity: 0.6 }}>
              <X size={11} />
            </button>
          </div>
        )}

        {runState === 'dispatched' && (
          <div className="animate-in" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: t.successBg, border: `1px solid ${t.successBorder}`,
            borderRadius: 10, padding: '6px 12px',
          }}>
            <CheckCircle size={13} style={{ color: t.successColor }} />
            <span style={{ fontSize: 12, color: t.successColor, fontWeight: 450 }}>Dispatched</span>
          </div>
        )}

        {isBusy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Loader2 size={13} className="animate-spin" style={{ color: t.accent }} />
            <span style={{ fontSize: 12, color: t.textTertiary }}>
              {runState === 'saving' ? 'Saving…' : 'Running…'}
            </span>
          </div>
        )}

        {/* Theme */}
        <button onClick={toggleTheme}
          style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, border: `1px solid ${t.btnBorder}`,
            background: t.btnBg, color: t.iconDefault,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = t.btnHoverBg; el.style.color = t.btnHoverColor }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = t.btnBg; el.style.color = t.iconDefault }}
        >
          {isLight ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* History */}
        <button onClick={onToggleHistory}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 14px', borderRadius: 10,
            border: `1px solid ${showHistory ? t.accent + '60' : t.btnBorder}`,
            background: showHistory ? t.accent + '18' : t.btnBg,
            color: showHistory ? t.accent : t.btnColor,
            fontSize: 13, fontWeight: 450, cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { if (!showHistory) { const el = e.currentTarget as HTMLElement; el.style.background = t.btnHoverBg; el.style.color = t.btnHoverColor } }}
          onMouseLeave={(e) => { if (!showHistory) { const el = e.currentTarget as HTMLElement; el.style.background = t.btnBg; el.style.color = t.btnColor } }}
        >
          <Clock size={13} />
          History
        </button>

        {/* Save */}
        <button onClick={() => run(false)} disabled={isBusy}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 14px', borderRadius: 10,
            border: `1px solid ${t.btnBorder}`, background: t.btnBg,
            color: t.btnColor, fontSize: 13, fontWeight: 450,
            cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.4 : 1, transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { if (!isBusy) { const el = e.currentTarget as HTMLElement; el.style.background = t.btnHoverBg; el.style.color = t.btnHoverColor } }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = t.btnBg; el.style.color = t.btnColor }}
        >
          <Save size={13} />
          Save
        </button>

        {/* Save & Run */}
        <button onClick={() => run(true)} disabled={isBusy}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            height: 36, padding: '0 18px', borderRadius: 10,
            border: 'none',
            background: isBusy ? `${t.accent}70` : t.accentGradient,
            color: '#fff', fontSize: 13, fontWeight: 500,
            cursor: isBusy ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            boxShadow: isBusy ? 'none' : `0 4px 16px ${t.accent}50`,
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => { if (!isBusy) { const el = e.currentTarget as HTMLElement; el.style.filter = 'brightness(1.1)'; el.style.boxShadow = `0 6px 22px ${t.accent}65` } }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.filter = 'none'; el.style.boxShadow = `0 4px 16px ${t.accent}50` }}
        >
          {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="white" />}
          Save & Run
        </button>
      </div>
    </header>
  )
}
