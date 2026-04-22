import { useCallback, useRef } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap,
  ReactFlowProvider, useReactFlow, type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore, type WorkflowNode } from '../store/workflowStore'
import { WorkflowNode as WorkflowNodeComponent } from './nodes/WorkflowNode'
import { NODE_COLOR, NODE_TYPE_DEFINITIONS } from '../constants/nodeTypes'
import { useTheme } from '../hooks/useTheme'
import type { NodeType } from '../types'

const nodeTypes: NodeTypes = { workflowNode: WorkflowNodeComponent }

function Canvas() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()
  const t = useTheme()

  const nodes = useWorkflowStore((s) => s.nodes)
  const edges = useWorkflowStore((s) => s.edges)
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange)
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange)
  const onConnect = useWorkflowStore((s) => s.onConnect)
  const addNode = useWorkflowStore((s) => s.addNode)
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId)

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }, [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/reactflow')
    if (!raw) return
    const { type, label, defaultConfig } = JSON.parse(raw) as { type: NodeType; label: string; defaultConfig: Record<string, unknown> }
    addNode(type, label, screenToFlowPosition({ x: e.clientX, y: e.clientY }), defaultConfig)
  }, [screenToFlowPosition, addNode])

  const onNodeClick = useCallback((_: React.MouseEvent, node: WorkflowNode) => setSelectedNodeId(node.id), [setSelectedNodeId])
  const onPaneClick = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId])
  const miniMapNodeColor = useCallback((node: WorkflowNode) => NODE_COLOR[node.data.nodeType] ?? '#888', [])

  // Extract background color from gradient string for ReactFlow
  const canvasSolid = t.theme === 'light' ? '#eeeef3' : '#080809'

  return (
    <div ref={wrapperRef} style={{ position: 'relative', height: '100%', width: '100%', background: t.canvasBg }} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.35 }}
        minZoom={0.15} maxZoom={2.5}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color={t.dotColor} style={{ background: canvasSolid }} />
        <Controls position="bottom-right" style={{ bottom: 16, right: 16 }} />
        <MiniMap
          nodeColor={miniMapNodeColor}
          position="bottom-left"
          style={{
            background: t.minimapBg, border: `1px solid ${t.divider}`,
            borderRadius: 12, backdropFilter: 'blur(12px)',
          }}
          maskColor={t.minimapMask}
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
              {NODE_TYPE_DEFINITIONS.slice(0, 3).map((def) => (
                <div key={def.type} style={{
                  padding: '10px 16px', borderRadius: 14,
                  background: t.theme === 'light' ? '#fff' : '#1a1a1f',
                  border: `1px solid ${def.color}28`,
                  boxShadow: t.theme === 'light' ? `0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px ${def.color}18` : `0 4px 16px rgba(0,0,0,0.3)`,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: def.color, margin: '0 auto 7px', opacity: 0.85 }} />
                  <p style={{ fontSize: 11, fontWeight: 500, color: def.color, margin: 0, opacity: 0.85 }}>{def.label}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: t.textTertiary, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Drag nodes from the sidebar
            </p>
            <p style={{ fontSize: 12, color: t.textMuted, margin: 0 }}>
              Connect handles to build your pipeline
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function WorkflowBuilder() {
  return <ReactFlowProvider><Canvas /></ReactFlowProvider>
}
