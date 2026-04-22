import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { NodeConfig, NodeType, WorkflowNodeData, WorkflowPayload } from '../types'

export type WorkflowNode = Node<WorkflowNodeData, 'workflowNode'>

let _counter = 0
const genId = (): string => `node_${++_counter}_${Date.now()}`

interface WorkflowStore {
  nodes: WorkflowNode[]
  edges: Edge[]
  selectedNodeId: string | null
  workflowName: string
  savedWorkflowId: string | null
  theme: 'light' | 'dark'

  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  addNode: (nodeType: NodeType, label: string, position: XYPosition, defaultConfig?: NodeConfig) => void
  updateNodeConfig: (nodeId: string, config: NodeConfig) => void
  updateNodeLabel: (nodeId: string, label: string) => void
  deleteNode: (nodeId: string) => void
  setSelectedNodeId: (id: string | null) => void
  setWorkflowName: (name: string) => void
  setSavedWorkflowId: (id: string | null) => void
  toggleTheme: () => void

  getSelectedNode: () => WorkflowNode | null
  toBackendPayload: () => WorkflowPayload
}

export const useWorkflowStore = create<WorkflowStore>()(
  subscribeWithSelector((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    workflowName: 'Untitled Workflow',
    savedWorkflowId: null,
    theme: 'dark',

    onNodesChange: (changes) => {
      set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) }))
    },

    onEdgesChange: (changes) => {
      set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }))
    },

    onConnect: (connection) => {
      set((s) => ({
        edges: addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: '#6b7280', strokeWidth: 2 },
          },
          s.edges,
        ),
      }))
    },

    addNode: (nodeType, label, position, defaultConfig = {}) => {
      const id = genId()
      const node: WorkflowNode = {
        id,
        type: 'workflowNode',
        position,
        data: {
          label,
          nodeType,
          config: defaultConfig,
        },
      }
      set((s) => ({ nodes: [...s.nodes, node] }))
    },

    updateNodeConfig: (nodeId, config) => {
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config } } : n,
        ),
      }))
    },

    updateNodeLabel: (nodeId, label) => {
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, label } } : n,
        ),
      }))
    },

    deleteNode: (nodeId) => {
      set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== nodeId),
        edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
      }))
    },

    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setWorkflowName: (name) => set({ workflowName: name }),
    setSavedWorkflowId: (id) => set({ savedWorkflowId: id }),
    toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

    getSelectedNode: () => {
      const { nodes, selectedNodeId } = get()
      return nodes.find((n) => n.id === selectedNodeId) ?? null
    },

    toBackendPayload: (): WorkflowPayload => {
      const { nodes, edges, workflowName } = get()
      return {
        name: workflowName,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.nodeType,
          label: n.data.label,
          config: n.data.config,
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
        })),
      }
    },
  })),
)
