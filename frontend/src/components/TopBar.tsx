import { useState } from 'react'
import { Play, Save, Loader2, Clock, X } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'
import { createWorkflow, triggerRun } from '../api/client'

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

  const [runState, setRunState] = useState<RunState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSaveAndRun = async () => {
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
      setRunState('triggering')
      const run = await triggerRun(workflow.id)
      setRunState('dispatched')
      onRunDispatched(run.run_id)
      setTimeout(() => setRunState('idle'), 2000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setRunState('error')
      setTimeout(() => setRunState('idle'), 4000)
    }
  }

  const handleSaveOnly = async () => {
    if (nodes.length === 0) return
    setRunState('saving')
    try {
      const workflow = await createWorkflow(toBackendPayload())
      setSavedWorkflowId(workflow.id)
      setRunState('dispatched')
      setTimeout(() => setRunState('idle'), 1500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setRunState('error')
      setTimeout(() => setRunState('idle'), 4000)
    }
  }

  const isBusy = runState === 'saving' || runState === 'triggering'

  return (
    <header
      className="flex h-[52px] flex-shrink-0 items-center px-4 gap-3"
      style={{
        background: 'rgba(12,12,14,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px]"
          style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="2.5" cy="6" r="1.8" fill="white" fillOpacity="0.95" />
            <circle cx="9.5" cy="2.5" r="1.8" fill="white" fillOpacity="0.95" />
            <circle cx="9.5" cy="9.5" r="1.8" fill="white" fillOpacity="0.95" />
            <line x1="4.2" y1="5.1" x2="7.8" y2="3.4" stroke="white" strokeWidth="0.9" strokeOpacity="0.7" />
            <line x1="4.2" y1="6.9" x2="7.8" y2="8.6" stroke="white" strokeWidth="0.9" strokeOpacity="0.7" />
          </svg>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}>
          ORCHESTRATOR
        </span>
      </div>

      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Workflow name */}
      <input
        type="text"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        placeholder="Untitled workflow"
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'rgba(255,255,255,0.82)',
          fontSize: 14,
          fontWeight: 450,
          width: 200,
          padding: '4px 6px',
          borderRadius: 6,
          transition: 'background 0.15s',
        }}
        onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)' }}
        onBlur={(e) => { e.target.style.background = 'transparent' }}
      />

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Status feedback */}
        {runState === 'error' && (
          <div
            className="flex items-center gap-2 animate-in"
            style={{
              background: 'rgba(255,59,48,0.12)',
              border: '1px solid rgba(255,59,48,0.2)',
              borderRadius: 8,
              padding: '5px 10px',
            }}
          >
            <span style={{ fontSize: 12, color: 'rgba(255,100,90,0.95)' }}>{errorMsg}</span>
            <button onClick={() => setRunState('idle')} style={{ color: 'rgba(255,100,90,0.6)', lineHeight: 0 }}>
              <X size={11} />
            </button>
          </div>
        )}

        {runState === 'dispatched' && (
          <div
            className="flex items-center gap-2 animate-in"
            style={{
              background: 'rgba(48,209,88,0.10)',
              border: '1px solid rgba(48,209,88,0.18)',
              borderRadius: 8,
              padding: '5px 10px',
            }}
          >
            <span style={{ fontSize: 12, color: 'rgba(80,220,110,0.95)' }}>Dispatched</span>
          </div>
        )}

        {isBusy && (
          <div className="flex items-center gap-1.5" style={{ padding: '0 4px' }}>
            <Loader2 size={12} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              {runState === 'saving' ? 'Saving…' : 'Running…'}
            </span>
          </div>
        )}

        {/* History */}
        <button
          onClick={onToggleHistory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 11px',
            borderRadius: 8,
            border: showHistory ? '1px solid rgba(10,132,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
            background: showHistory ? 'rgba(10,132,255,0.12)' : 'rgba(255,255,255,0.04)',
            color: showHistory ? 'rgba(10,132,255,0.95)' : 'rgba(255,255,255,0.5)',
            fontSize: 13,
            fontWeight: 450,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Clock size={13} />
          History
        </button>

        {/* Save */}
        <button
          onClick={handleSaveOnly}
          disabled={isBusy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 11px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 13,
            fontWeight: 450,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            opacity: isBusy ? 0.4 : 1,
            transition: 'all 0.15s',
          }}
        >
          <Save size={13} />
          Save
        </button>

        {/* Save & Run */}
        <button
          onClick={handleSaveAndRun}
          disabled={isBusy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            borderRadius: 8,
            border: 'none',
            background: isBusy ? 'rgba(10,132,255,0.5)' : '#0A84FF',
            color: '#fff',
            fontSize: 13,
            fontWeight: 550,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          Save & Run
        </button>
      </div>
    </header>
  )
}
