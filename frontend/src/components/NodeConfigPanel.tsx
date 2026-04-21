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
      key: 'method', label: 'Method', type: 'select',
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => ({ value: m, label: m })),
    },
    { key: 'headers', label: 'Headers', type: 'json', placeholder: '{"Authorization": "Bearer ..."}' },
    { key: 'body', label: 'Body', type: 'json', placeholder: '{"key": "value"}' },
    { key: 'timeout', label: 'Timeout (s)', type: 'number', min: 1, max: 120, placeholder: '30' },
  ],
  transform: [
    { key: 'source_node', label: 'Source Node ID', type: 'text', placeholder: 'node_1_...' },
    { key: 'mappings', label: 'Mappings', type: 'json', placeholder: '{"output_field": "body.data"}' },
  ],
  filter: [
    { key: 'source_node', label: 'Source Node ID', type: 'text', placeholder: 'node_1_...' },
    { key: 'field', label: 'Field Path', type: 'text', placeholder: 'body.status' },
    {
      key: 'operator', label: 'Operator', type: 'select',
      options: [
        { value: 'eq', label: 'Equals' },
        { value: 'ne', label: 'Not Equals' },
        { value: 'gt', label: 'Greater Than' },
        { value: 'gte', label: 'Greater Than or Equal' },
        { value: 'lt', label: 'Less Than' },
        { value: 'lte', label: 'Less Than or Equal' },
        { value: 'contains', label: 'Contains' },
        { value: 'startswith', label: 'Starts With' },
      ],
    },
    { key: 'value', label: 'Compare Value', type: 'json', placeholder: '"active" or true or 42' },
  ],
  merge: [
    {
      key: 'strategy', label: 'Merge Strategy', type: 'select',
      options: [
        { value: 'shallow', label: 'Shallow — top-level keys' },
        { value: 'deep', label: 'Deep — recursive merge' },
      ],
    },
  ],
  delay: [
    { key: 'seconds', label: 'Delay (seconds)', type: 'number', min: 1, max: 300, placeholder: '1' },
  ],
  noop: [],
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.09)',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.88)',
  fontSize: 13,
  outline: 'none',
  transition: 'border 0.15s, background 0.15s',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 6,
}

function NumberField({ fieldKey, label, placeholder, value, min, max, onChange }: {
  fieldKey: keyof NodeConfig; label: string; placeholder?: string
  value: unknown; min?: number; max?: number
  onChange: (key: keyof NodeConfig, v: unknown) => void
}) {
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

  const outOfRange = raw !== '' && ((min != null && parseFloat(raw) < min) || (max != null && parseFloat(raw) > max))

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, borderColor: outOfRange ? 'rgba(255,159,10,0.4)' : undefined }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
        onBlur={(e) => { e.target.style.borderColor = outOfRange ? 'rgba(255,159,10,0.4)' : 'rgba(255,255,255,0.09)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
      />
      {outOfRange && (
        <p style={{ fontSize: 11, color: 'rgba(255,159,10,0.85)', marginTop: 4 }}>
          Range: {min ?? '—'} – {max ?? '—'}
        </p>
      )}
    </div>
  )
}

function JsonField({ fieldKey, label, placeholder, value, onChange }: {
  fieldKey: keyof NodeConfig; label: string; placeholder?: string
  value: unknown; onChange: (key: keyof NodeConfig, v: unknown) => void
}) {
  const [raw, setRaw] = useState(() => {
    if (value === undefined || value === null) return ''
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  })
  const [err, setErr] = useState(false)

  useEffect(() => {
    setRaw(value === undefined || value === null ? '' : typeof value === 'string' ? value : JSON.stringify(value, null, 2))
    setErr(false)
  }, [fieldKey, value])

  const handleChange = (text: string) => {
    setRaw(text)
    if (!text.trim()) { setErr(false); onChange(fieldKey, undefined); return }
    try { setErr(false); onChange(fieldKey, JSON.parse(text)) }
    catch { setErr(true) }
  }

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea
        rows={3}
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          resize: 'vertical',
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontSize: 12,
          borderColor: err ? 'rgba(255,59,48,0.4)' : undefined,
          lineHeight: 1.6,
        }}
        onFocus={(e) => { if (!err) { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(255,255,255,0.06)' } }}
        onBlur={(e) => { if (!err) { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.background = 'rgba(255,255,255,0.04)' } }}
      />
      {err && <p style={{ fontSize: 11, color: 'rgba(255,59,48,0.85)', marginTop: 4 }}>Invalid JSON</p>}
    </div>
  )
}

export function NodeConfigPanel() {
  const node = useWorkflowStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId) ?? null)
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig)
  const updateNodeLabel = useWorkflowStore((s) => s.updateNodeLabel)
  const deleteNode = useWorkflowStore((s) => s.deleteNode)
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId)

  const panelStyle: React.CSSProperties = {
    width: 280,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'rgba(12,12,14,0.97)',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
  }

  if (!node) {
    return (
      <aside style={panelStyle}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <div style={{ width: 16, height: 16, border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 4 }} />
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', fontWeight: 500 }}>No node selected</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0, lineHeight: 1.5 }}>Click a node on the canvas to configure it</p>
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
    <aside style={panelStyle}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px', opacity: 0.85 }}>
            {nodeType.replace(/_/g, ' ')}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: 0, fontFamily: 'ui-monospace, monospace' }}>
            {node.id.slice(0, 16)}…
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => deleteNode(node.id)}
            style={{
              padding: 6, borderRadius: 7, border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.28)',
              cursor: 'pointer', transition: 'all 0.15s', lineHeight: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,59,48,0.12)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,80,70,0.9)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)' }}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setSelectedNodeId(null)}
            style={{
              padding: 6, borderRadius: 7, border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.28)',
              cursor: 'pointer', transition: 'all 0.15s', lineHeight: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Label */}
          <div>
            <label style={labelStyle}>Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => updateNodeLabel(node.id, e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
            />
          </div>

          {fields.length === 0 && (
            <div style={{
              padding: '14px 12px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: 0 }}>No configuration required</p>
            </div>
          )}

          {fields.map((field) => {
            const val = config[field.key]

            if (field.type === 'json') {
              return <JsonField key={field.key} fieldKey={field.key} label={field.label} placeholder={field.placeholder} value={val} onChange={handleField} />
            }

            if (field.type === 'select') {
              return (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <select
                    value={(val as string) ?? ''}
                    onChange={(e) => handleField(field.key, e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
                  >
                    <option value="">Select…</option>
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )
            }

            if (field.type === 'number') {
              return <NumberField key={field.key} fieldKey={field.key} label={field.label} placeholder={field.placeholder} value={val} min={field.min} max={field.max} onChange={handleField} />
            }

            return (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}</label>
                <input
                  type="text"
                  value={(val as string) ?? ''}
                  onChange={(e) => handleField(field.key, e.target.value || undefined)}
                  placeholder={field.placeholder}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer — node ID */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{
          padding: '8px 10px', borderRadius: 8,
          background: `${color}0d`,
          border: `1px solid ${color}20`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Node ID</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', margin: 0, fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>{node.id}</p>
        </div>
      </div>
    </aside>
  )
}
