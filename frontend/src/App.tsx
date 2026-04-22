import { useCallback, useEffect, useState } from 'react'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { WorkflowBuilder } from './components/WorkflowBuilder'
import { NodeConfigPanel } from './components/NodeConfigPanel'
import { RunStatusPanel } from './components/RunStatusPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { useRunPoller } from './hooks/useRunPoller'
import { useWorkflowStore } from './store/workflowStore'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const savedWorkflowId = useWorkflowStore((s) => s.savedWorkflowId)
  const theme = useWorkflowStore((s) => s.theme)
  const t = useTheme()
  const { runDetail, isPolling, startPolling, stopPolling } = useRunPoller()
  const [showRunPanel, setShowRunPanel] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Sync data-theme attribute and body background
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.style.background = t.canvasBg
    document.body.style.color = t.textPrimary
  }, [theme, t.canvasBg, t.textPrimary])

  const handleRunDispatched = useCallback((runId: string) => {
    setShowRunPanel(true)
    setShowHistory(false)
    startPolling(runId)
  }, [startPolling])

  const handleCloseRunPanel = useCallback(() => {
    setShowRunPanel(false)
    stopPolling()
  }, [stopPolling])

  const handleToggleHistory = useCallback(() => {
    setShowHistory((p) => !p)
    setShowRunPanel(false)
  }, [])

  const handleSelectRun = useCallback((runId: string) => {
    setShowHistory(false)
    setShowRunPanel(true)
    startPolling(runId)
  }, [startPolling])

  const rightPanel = showRunPanel ? 'run' : showHistory ? 'history' : 'config'

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        flexDirection: 'column',
        overflow: 'hidden',
        background: t.canvasBg,
        transition: 'background 0.3s ease',
      }}
    >
      <TopBar
        onRunDispatched={handleRunDispatched}
        onToggleHistory={handleToggleHistory}
        showHistory={showHistory}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar />

        <main style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <WorkflowBuilder />
        </main>

        {rightPanel === 'run' && (
          <RunStatusPanel runDetail={runDetail} isPolling={isPolling} onClose={handleCloseRunPanel} />
        )}
        {rightPanel === 'history' && (
          <HistoryPanel workflowId={savedWorkflowId} onSelectRun={handleSelectRun} onClose={() => setShowHistory(false)} />
        )}
        {rightPanel === 'config' && <NodeConfigPanel />}
      </div>
    </div>
  )
}
