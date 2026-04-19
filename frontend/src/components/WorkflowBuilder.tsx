import { useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore, type WorkflowNode } from '../store/workflowStore'
import { WorkflowNode as WorkflowNodeComponent } from './nodes/WorkflowNode'
import { NODE_COLOR, NODE_TYPE_DEFINITIONS } from '../constants/nodeTypes'
import type { NodeType } from '../types'

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNodeComponent,
}

function Canvas() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const nodes = useWorkflowStore((s) => s.nodes)
  const edges = useWorkflowStore((s) => s.edges)
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange)
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange)
  const onConnect = useWorkflowStore((s) => s.onConnect)
  const addNode = useWorkflowStore((s) => s.addNode)
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId)

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/reactflow')
      if (!raw) return
      const { type, label, defaultConfig } = JSON.parse(raw) as {
        type: NodeType
        label: string
        defaultConfig: Record<string, unknown>
      }
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addNode(type, label, position, defaultConfig)
    },
    [screenToFlowPosition, addNode],
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: WorkflowNode) => {
      setSelectedNodeId(node.id)
    },
    [setSelectedNodeId],
  )

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [setSelectedNodeId])

  const miniMapNodeColor = useCallback((node: WorkflowNode) => {
    return NODE_COLOR[node.data.nodeType] ?? '#6b7280'
  }, [])

  const nodesDef = NODE_TYPE_DEFINITIONS
  const emptyCanvas = nodes.length === 0

  return (
    <div ref={wrapperRef} className="relative h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        style={{ background: '#0d0e17' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <Controls
          style={{
            background: '#1a1d27',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
          }}
        />
        <MiniMap
          nodeColor={miniMapNodeColor}
          style={{
            background: '#12131c',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
          }}
          maskColor="rgba(13,14,23,0.7)"
        />
      </ReactFlow>

      {emptyCanvas && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex items-center justify-center gap-2">
              {nodesDef.slice(0, 3).map((def) => (
                <div
                  key={def.type}
                  style={{ borderColor: `${def.color}30`, background: `${def.color}10` }}
                  className="rounded-xl border px-3 py-2"
                >
                  <div
                    style={{ background: def.color }}
                    className="mx-auto mb-1 h-1.5 w-1.5 rounded-full"
                  />
                  <p style={{ color: def.color }} className="text-[10px] font-semibold">
                    {def.label}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-white/30">Drag nodes from the sidebar</p>
              <p className="mt-1 text-xs text-white/15">
                Connect them by dragging from output → input handles
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}
