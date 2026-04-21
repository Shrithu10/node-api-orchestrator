import { useCallback, useRef } from 'react'
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
    return NODE_COLOR[node.data.nodeType] ?? '#3f3f3f'
  }, [])

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
        fitViewOptions={{ padding: 0.35 }}
        minZoom={0.15}
        maxZoom={2.5}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        style={{ background: '#080809' }}
        defaultEdgeOptions={{
          style: { strokeWidth: 1.5 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.045)"
        />
        <Controls
          position="bottom-right"
          style={{ bottom: 16, right: 16 }}
        />
        <MiniMap
          nodeColor={miniMapNodeColor}
          position="bottom-left"
          style={{
            background: 'rgba(18,18,20,0.92)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            backdropFilter: 'blur(12px)',
          }}
          maskColor="rgba(8,8,9,0.75)"
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {NODE_TYPE_DEFINITIONS.slice(0, 3).map((def) => (
                <div
                  key={def.type}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 10,
                    border: `1px solid ${def.color}25`,
                    background: `${def.color}0c`,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: def.color, margin: '0 auto 5px', opacity: 0.8 }} />
                  <p style={{ fontSize: 11, fontWeight: 600, color: def.color, margin: 0, opacity: 0.8 }}>{def.label}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, fontWeight: 450, color: 'rgba(255,255,255,0.28)', margin: '0 0 6px' }}>
              Drag nodes from the sidebar to get started
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.14)', margin: 0 }}>
              Connect output → input handles to build your pipeline
            </p>
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
