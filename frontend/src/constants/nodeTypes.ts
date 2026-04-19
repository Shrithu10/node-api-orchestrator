import type { NodeTypeDefinition, NodeType } from '../types'

export const NODE_TYPE_DEFINITIONS: NodeTypeDefinition[] = [
  {
    type: 'http_request',
    label: 'HTTP Request',
    description: 'Fetch data from an external API endpoint',
    color: '#3b82f6',
    defaultConfig: { method: 'GET', url: '', timeout: 30 },
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Map and reshape data from upstream nodes',
    color: '#a855f7',
    defaultConfig: { mappings: {} },
  },
  {
    type: 'filter',
    label: 'Filter',
    description: 'Conditionally pass data based on a field value',
    color: '#f97316',
    defaultConfig: { operator: 'eq' },
  },
  {
    type: 'merge',
    label: 'Merge',
    description: 'Combine outputs from multiple upstream nodes',
    color: '#22c55e',
    defaultConfig: { strategy: 'shallow' },
  },
  {
    type: 'delay',
    label: 'Delay',
    description: 'Pause execution for a specified duration',
    color: '#eab308',
    defaultConfig: { seconds: 1 },
  },
  {
    type: 'noop',
    label: 'No-Op',
    description: 'Pass-through node useful for debugging',
    color: '#6b7280',
    defaultConfig: {},
  },
]

export const NODE_COLOR: Record<NodeType, string> = {
  http_request: '#3b82f6',
  transform: '#a855f7',
  filter: '#f97316',
  merge: '#22c55e',
  delay: '#eab308',
  noop: '#6b7280',
}

export const NODE_LABEL: Record<NodeType, string> = {
  http_request: 'HTTP Request',
  transform: 'Transform',
  filter: 'Filter',
  merge: 'Merge',
  delay: 'Delay',
  noop: 'No-Op',
}
