import { useCallback, useState } from 'react'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { WorkflowBuilder } from './components/WorkflowBuilder'
import { NodeConfigPanel } from './components/NodeConfigPanel'
import { RunStatusPanel } from './components/RunStatusPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { useRunPoller } from './hooks/useRunPoller'
import { useWorkflowStore } from './store/workflowStore'

export default function App() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const savedWorkflowId = useWorkflowStore((s) => s.savedWorkflowId)
  const { runDetail, isPolling, startPolling, stopPolling } = useRunPoller()
  const [showRunPanel, setShowRunPanel] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const handleRunDispatched = useCallback(
    (runId: string) => {
      setShowRunPanel(true)
      setShowHistory(false)
      startPolling(runId)
    },
    [startPolling],
  )

  const handleCloseRunPanel = useCallback(() => {
    setShowRunPanel(false)
    stopPolling()
  }, [stopPolling])

  const handleToggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev)
    setShowRunPanel(false)
  }, [])

  const handleSelectRun = useCallback(
    (runId: string) => {
      setShowHistory(false)
      setShowRunPanel(true)
      startPolling(runId)
    },
    [startPolling],
  )

  // Priority: run panel > history panel > node config panel
  const rightPanel = showRunPanel
    ? 'run'
    : showHistory
      ? 'history'
      : selectedNodeId
        ? 'config'
        : 'config'

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0d0e17]">
      <TopBar
        onRunDispatched={handleRunDispatched}
        onToggleHistory={handleToggleHistory}
        showHistory={showHistory}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <main className="relative flex-1 overflow-hidden">
          <WorkflowBuilder />
        </main>

        {rightPanel === 'run' && (
          <RunStatusPanel
            runDetail={runDetail}
            isPolling={isPolling}
            onClose={handleCloseRunPanel}
          />
        )}

        {rightPanel === 'history' && (
          <HistoryPanel
            workflowId={savedWorkflowId}
            onSelectRun={handleSelectRun}
            onClose={() => setShowHistory(false)}
          />
        )}

        {rightPanel === 'config' && <NodeConfigPanel />}
      </div>
    </div>
  )
}
