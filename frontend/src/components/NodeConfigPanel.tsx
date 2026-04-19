import { useEffect, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'
import { NODE_COLOR } from '../constants/nodeTypes'
import type { NodeConfig, NodeType } from '../types'

type FieldType = 'text' | 'number' | 'select' | 'json'

interface FieldDef {
  key: keyof NodeConfig
  label: string
  type: FieldType
  placeholder?: string
  options?: { value: string; label: string }[]
  min?: number
  max?: number
}

const FIELDS: Record<NodeType, FieldDef[]> = {
  http_request: [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/data' },
    {
      key: 'method',
      label: 'Method',
      type: 'select',
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => ({ value: m, label: m })),
    },
    { key: 'headers', label: 'Headers (JSON)', type: 'json', placeholder: '{"Authorization": "Bearer ..."}' },
    { key: 'body', label: 'Body (JSON)', type: 'json', placeholder: '{"key": "value"}' },
    { key: 'timeout', label: 'Timeout (s)', type: 'number', min: 1, max: 120, placeholder: '30' },
  ],
  transform: [
    { key: 'source_node', label: 'Source Node ID', type: 'text', placeholder: 'node_1_...' },
    { key: 'mappings', label: 'Mappings (JSON)', type: 'json', placeholder: '{"output_field": "body.data"}' },
  ],
  filter: [
    { key: 'source_node', label: 'Source Node ID', type: 'text', placeholder: 'node_1_...' },
    { key: 'field', label: 'Field Path', type: 'text', placeholder: 'body.status' },
    {
      key: 'operator',
      label: 'Operator',
      type: 'select',
      options: [
        { value: 'eq', label: 'Equals (eq)' },
        { value: 'ne', label: 'Not Equals (ne)' },
        { value: 'gt', label: 'Greater Than (gt)' },
        { value: 'gte', label: 'Greater Than or Equal (gte)' },
        { value: 'lt', label: 'Less Than (lt)' },
        { value: 'lte', label: 'Less Than or Equal (lte)' },
        { value: 'contains', label: 'Contains' },
        { value: 'startswith', label: 'Starts With' },
      ],
    },
    { key: 'value', label: 'Compare Value (JSON)', type: 'json', placeholder: '"active" / true / 42' },
  ],
  merge: [
    {
      key: 'strategy',
      label: 'Merge Strategy',
      type: 'select',
      options: [
        { value: 'shallow', label: 'Shallow (top-level keys)' },
        { value: 'deep', label: 'Deep (recursive merge)' },
      ],
    },
  ],
  delay: [
    { key: 'seconds', label: 'Delay (seconds)', type: 'number', min: 1, max: 300, placeholder: '1' },
  ],
  noop: [],
}

const inputBase =
  'w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-white/20 focus:bg-white/8'

interface NumberFieldProps {
  fieldKey: keyof NodeConfig
  label: string
  placeholder?: string
  value: unknown
  min?: number
  max?: number
  onChange: (key: keyof NodeConfig, v: unknown) => void
}

function NumberField({ fieldKey, label, placeholder, value, min, max, onChange }: NumberFieldProps) {
  const [raw, setRaw] = useState(() => (value != null ? String(value) : ''))

  useEffect(() => {
    setRaw(value != null ? String(value) : '')
  }, [fieldKey, value])

  const handleChange = (text: string) => {
    if (text !== '' && !/^-?\d*\.?\d*$/.test(text)) return
    setRaw(text)
    const num = parseFloat(text)
    onChange(fieldKey, text === '' || isNaN(num) ? undefined : num)
  }

  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
        {label}
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={inputBase}
      />
      {raw !== '' && min != null && parseFloat(raw) < min && (
        <p className="mt-1 text-[10px] text-yellow-400/80">Min value: {min}</p>
      )}
      {raw !== '' && max != null && parseFloat(raw) > max && (
        <p className="mt-1 text-[10px] text-yellow-400/80">Max value: {max}</p>
      )}
    </div>
  )
}

interface JsonFieldProps {
  fieldKey: keyof NodeConfig
  label: string
  placeholder?: string
  value: unknown
  onChange: (key: keyof NodeConfig, v: unknown) => void
}

function JsonField({ fieldKey, label, placeholder, value, onChange }: JsonFieldProps) {
  const [raw, setRaw] = useState(() => {
    if (value === undefined || value === null) return ''
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  })
  const [error, setError] = useState(false)

  useEffect(() => {
    if (value === undefined || value === null) {
      setRaw('')
    } else {
      setRaw(typeof value === 'string' ? value : JSON.stringify(value, null, 2))
    }
    setError(false)
  }, [fieldKey, value])

  const handleChange = (text: string) => {
    setRaw(text)
    if (!text.trim()) {
      setError(false)
      onChange(fieldKey, undefined)
      return
    }
    try {
      const parsed = JSON.parse(text)
      setError(false)
      onChange(fieldKey, parsed)
    } catch {
      setError(true)
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
        {label}
      </label>
      <textarea
        rows={3}
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputBase} resize-y font-mono text-xs ${error ? 'border-red-500/60 focus:border-red-500/80' : ''}`}
      />
      {error && (
        <p className="mt-1 text-[10px] text-red-400">Invalid JSON</p>
      )}
    </div>
  )
}

export function NodeConfigPanel() {
  const node = useWorkflowStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId) ?? null)
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig)
  const updateNodeLabel = useWorkflowStore((s) => s.updateNodeLabel)
  const deleteNode = useWorkflowStore((s) => s.deleteNode)
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId)

  if (!node) {
    return (
      <aside className="flex h-full w-80 flex-shrink-0 flex-col items-center justify-center border-l border-white/5 bg-[#12131c]">
        <div className="space-y-2 px-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/8 bg-white/4">
            <div className="h-4 w-4 rounded-sm border-2 border-white/20" />
          </div>
          <p className="text-sm font-medium text-white/30">No node selected</p>
          <p className="text-xs text-white/20">Click a node on the canvas to configure it</p>
        </div>
      </aside>
    )
  }

  const { nodeType, config, label } = node.data
  const color = NODE_COLOR[nodeType]
  const fields = FIELDS[nodeType]

  const handleField = (key: keyof NodeConfig, val: unknown) => {
    updateNodeConfig(node.id, { ...config, [key]: val })
  }

  return (
    <aside className="flex h-full w-80 flex-shrink-0 flex-col border-l border-white/5 bg-[#12131c]">
      <div
        style={{ borderBottom: `1px solid ${color}20` }}
        className="flex items-center justify-between px-4 py-3"
      >
        <div>
          <p
            style={{ color }}
            className="text-[10px] font-semibold uppercase tracking-widest"
          >
            {nodeType.replace(/_/g, ' ')}
          </p>
          <p className="mt-0.5 text-xs text-white/40">{node.id}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => deleteNode(node.id)}
            className="rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/15 hover:text-red-400"
            title="Delete node"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-white/60"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
              Node Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => updateNodeLabel(node.id, e.target.value)}
              className={inputBase}
            />
          </div>

          {fields.length === 0 && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-4 text-center">
              <p className="text-xs text-white/30">No configuration required</p>
            </div>
          )}

          {fields.map((field) => {
            const val = config[field.key]

            if (field.type === 'json') {
              return (
                <JsonField
                  key={field.key}
                  fieldKey={field.key}
                  label={field.label}
                  placeholder={field.placeholder}
                  value={val}
                  onChange={handleField}
                />
              )
            }

            if (field.type === 'select') {
              return (
                <div key={field.key}>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                    {field.label}
                  </label>
                  <select
                    value={(val as string) ?? ''}
                    onChange={(e) => handleField(field.key, e.target.value)}
                    className={`${inputBase} cursor-pointer`}
                  >
                    <option value="">Select…</option>
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }

            if (field.type === 'number') {
              return (
                <NumberField
                  key={field.key}
                  fieldKey={field.key}
                  label={field.label}
                  placeholder={field.placeholder}
                  value={val}
                  min={field.min}
                  max={field.max}
                  onChange={handleField}
                />
              )
            }

            return (
              <div key={field.key}>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={(val as string) ?? ''}
                  onChange={(e) => handleField(field.key, e.target.value || undefined)}
                  placeholder={field.placeholder}
                  className={inputBase}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-white/5 px-4 py-3">
        <div
          style={{ background: `${color}10`, borderColor: `${color}25` }}
          className="rounded-lg border px-3 py-2"
        >
          <p style={{ color }} className="text-[10px] font-semibold uppercase tracking-wider">
            ID
          </p>
          <p className="mt-0.5 break-all font-mono text-[10px] text-white/40">{node.id}</p>
        </div>
      </div>
    </aside>
  )
}
