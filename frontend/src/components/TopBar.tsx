import { useState } from 'react'
import { Play, Save, Loader2, CheckCircle2, AlertCircle, History } from 'lucide-react'
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
      setErrorMsg('Add at least one node before running')
      setRunState('error')
      setTimeout(() => setRunState('idle'), 3000)
      return
    }

    setRunState('saving')
    setErrorMsg('')

    try {
      const payload = toBackendPayload()
      const workflow = await createWorkflow(payload)
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
      const payload = toBackendPayload()
      const workflow = await createWorkflow(payload)
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
    <header className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-white/5 bg-[#0d0e17] px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-600">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="2" cy="5" r="1.5" fill="white" />
            <circle cx="8" cy="2" r="1.5" fill="white" />
            <circle cx="8" cy="8" r="1.5" fill="white" />
            <line x1="3.4" y1="4.3" x2="6.6" y2="2.7" stroke="white" strokeWidth="0.8" />
            <line x1="3.4" y1="5.7" x2="6.6" y2="7.3" stroke="white" strokeWidth="0.8" />
          </svg>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">
          Orchestrator
        </span>
      </div>

      <div className="mx-2 h-4 w-px bg-white/8" />

      <input
        type="text"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        className="w-52 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-white/80 outline-none transition hover:border-white/8 focus:border-white/15 focus:bg-white/5"
        placeholder="Workflow name…"
      />

      <div className="ml-auto flex items-center gap-2">
        {runState === 'error' && (
          <div className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1">
            <AlertCircle size={12} className="text-red-400" />
            <span className="text-xs text-red-300">{errorMsg}</span>
          </div>
        )}

        {runState === 'dispatched' && (
          <div className="flex items-center gap-1.5 rounded-lg border border-green-500/25 bg-green-500/10 px-2.5 py-1">
            <CheckCircle2 size={12} className="text-green-400" />
            <span className="text-xs text-green-300">Run dispatched</span>
          </div>
        )}

        {(runState === 'saving' || runState === 'triggering') && (
          <div className="flex items-center gap-1.5 px-2">
            <Loader2 size={12} className="animate-spin text-white/40" />
            <span className="text-xs text-white/40">
              {runState === 'saving' ? 'Saving…' : 'Dispatching…'}
            </span>
          </div>
        )}

        <button
          onClick={onToggleHistory}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            showHistory
              ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
              : 'border-white/8 bg-white/5 text-white/60 hover:border-white/15 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          <History size={12} />
          History
        </button>

        <button
          onClick={handleSaveOnly}
          disabled={isBusy}
          className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/15 hover:bg-white/10 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save size={12} />
          Save
        </button>

        <button
          onClick={handleSaveAndRun}
          disabled={isBusy}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Play size={12} />
          )}
          Save & Run
        </button>
      </div>
    </header>
  )
}
