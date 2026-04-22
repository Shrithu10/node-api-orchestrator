import { useEffect, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'
import { NODE_COLOR } from '../constants/nodeTypes'
import { useTheme } from '../hooks/useTheme'
import type { NodeConfig, NodeType } from '../types'

type FieldType = 'text' | 'number' | 'select' | 'json'

interface FieldDef {
  key: keyof NodeConfig; label: string; type: FieldType
  placeholder?: string; options?: { value: string; label: string }[]
  min?: number; max?: number
}

const FIELDS: Record<NodeType, FieldDef[]> = {
  http_request: [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/data' },
    { key: 'method', label: 'Method', type: 'select', options: ['GET','POST','PUT','DELETE','PATCH'].map(m => ({ value: m, label: m })) },
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
    { key: 'operator', label: 'Operator', type: 'select', options: [
      { value: 'eq', label: 'Equals' }, { value: 'ne', label: 'Not Equals' },
      { value: 'gt', label: 'Greater Than' }, { value: 'gte', label: 'Greater Than or Equal' },
      { value: 'lt', label: 'Less Than' }, { value: 'lte', label: 'Less Than or Equal' },
      { value: 'contains', label: 'Contains' }, { value: 'startswith', label: 'Starts With' },
    ]},
    { key: 'value', label: 'Compare Value', type: 'json', placeholder: '"active" or true or 42' },
  ],
  merge: [
    { key: 'strategy', label: 'Merge Strategy', type: 'select', options: [
      { value: 'shallow', label: 'Shallow — top-level keys' },
      { value: 'deep', label: 'Deep — recursive merge' },
    ]},
  ],
  delay: [{ key: 'seconds', label: 'Delay (seconds)', type: 'number', min: 1, max: 300, placeholder: '1' }],
  noop: [],
}

function NumberField({ fieldKey, label, placeholder, value, min, max, onChange }: {
  fieldKey: keyof NodeConfig; label: string; placeholder?: string
  value: unknown; min?: number; max?: number
  onChange: (k: keyof NodeConfig, v: unknown) => void
}) {
  const t = useTheme()
  const [raw, setRaw] = useState(() => value != null ? String(value) : '')
  useEffect(() => { setRaw(value != null ? String(value) : '') }, [fieldKey, value])

  const handleChange = (text: string) => {
    if (text !== '' && !/^-?\d*\.?\d*$/.test(text)) return
    setRaw(text)
    const num = parseFloat(text)
    onChange(fieldKey, text === '' || isNaN(num) ? undefined : num)
  }
  const outOfRange = raw !== '' && ((min != null && parseFloat(raw) < min) || (max != null && parseFloat(raw) > max))

  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 450, color: t.sectionLabel, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type="text" inputMode="numeric" value={raw}
        onChange={(e) => handleChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '8px 11px', borderRadius: 9, border: `1px solid ${outOfRange ? 'rgba(255,159,10,0.5)' : t.inputBorder}`, background: t.inputBg, color: t.inputColor, fontSize: 13, outline: 'none', transition: 'border 0.15s, background 0.15s', fontFamily: 'inherit' }}
        onFocus={(e) => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.background = t.inputFocusBg }}
        onBlur={(e) => { e.target.style.borderColor = outOfRange ? 'rgba(255,159,10,0.5)' : t.inputBorder; e.target.style.background = t.inputBg }}
      />
      {outOfRange && <p style={{ fontSize: 11, color: 'rgba(255,159,10,0.9)', marginTop: 4 }}>Range: {min ?? '—'} – {max ?? '—'}</p>}
    </div>
  )
}

function JsonField({ fieldKey, label, placeholder, value, onChange }: {
  fieldKey: keyof NodeConfig; label: string; placeholder?: string
  value: unknown; onChange: (k: keyof NodeConfig, v: unknown) => void
}) {
  const t = useTheme()
  const [raw, setRaw] = useState(() => value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value, null, 2))
  const [err, setErr] = useState(false)

  useEffect(() => {
    setRaw(value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value, null, 2))
    setErr(false)
  }, [fieldKey, value])

  const handleChange = (text: string) => {
    setRaw(text)
    if (!text.trim()) { setErr(false); onChange(fieldKey, undefined); return }
    try { setErr(false); onChange(fieldKey, JSON.parse(text)) } catch { setErr(true) }
  }

  const borderColor = err ? 'rgba(255,59,48,0.5)' : t.inputBorder

  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 450, color: t.sectionLabel, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{label}</label>
      <textarea
        rows={3} value={raw}
        onChange={(e) => handleChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '8px 11px', borderRadius: 9, border: `1px solid ${borderColor}`, background: t.inputBg, color: t.inputColor, fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'ui-monospace,"SF Mono",Menlo,monospace', lineHeight: 1.6, transition: 'border 0.15s, background 0.15s' }}
        onFocus={(e) => { if (!err) { e.target.style.borderColor = t.inputFocusBorder; e.target.style.background = t.inputFocusBg } }}
        onBlur={(e) => { if (!err) { e.target.style.borderColor = t.inputBorder; e.target.style.background = t.inputBg } }}
      />
      {err && <p style={{ fontSize: 11, color: 'rgba(255,59,48,0.9)', marginTop: 4 }}>Invalid JSON</p>}
    </div>
  )
}

export function NodeConfigPanel() {
  const node = useWorkflowStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId) ?? null)
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig)
  const updateNodeLabel = useWorkflowStore((s) => s.updateNodeLabel)
  const deleteNode = useWorkflowStore((s) => s.deleteNode)
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId)
  const t = useTheme()

  const panelStyle: React.CSSProperties = {
    width: 280, flexShrink: 0,
    display: 'flex', flexDirection: 'column', height: '100%',
    background: t.panelBg,
    borderLeft: `1px solid ${t.panelBorder}`,
    boxShadow: t.panelShadow,
    transition: 'background 0.3s ease, border-color 0.3s ease',
  }

  if (!node) {
    return (
      <aside style={panelStyle}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: t.cardBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, border: `1.5px solid ${t.textTertiary}`, borderRadius: 4, opacity: 0.7 }} />
          </div>
          <p style={{ fontSize: 13, color: t.textSecondary, margin: '0 0 6px', fontWeight: 500 }}>No node selected</p>
          <p style={{ fontSize: 12, color: t.textTertiary, margin: 0, lineHeight: 1.5 }}>Click a node on the canvas to configure it</p>
        </div>
      </aside>
    )
  }

  const { nodeType, config, label } = node.data
  const color = NODE_COLOR[nodeType]
  const fields = FIELDS[nodeType]
  const handleField = (key: keyof NodeConfig, val: unknown) => updateNodeConfig(node.id, { ...config, [key]: val })

  const iconBtn = (onClick: () => void, icon: React.ReactNode, hoverBg: string, hoverColor: string) => (
    <button onClick={onClick} style={{ padding: 7, borderRadius: 8, border: 'none', background: 'transparent', color: t.iconDefault, cursor: 'pointer', transition: 'all 0.15s', lineHeight: 0 }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = hoverBg; el.style.color = hoverColor }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = t.iconDefault }}>
      {icon}
    </button>
  )

  return (
    <aside style={panelStyle}>
      <div style={{ padding: '14px 14px 12px', borderBottom: `1px solid ${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, color, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px', opacity: 0.85 }}>
            {nodeType.replace(/_/g, ' ')}
          </p>
          <p style={{ fontSize: 11, color: t.textTertiary, margin: 0, fontFamily: 'ui-monospace,monospace' }}>
            {node.id.slice(0, 16)}…
          </p>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {iconBtn(() => deleteNode(node.id), <Trash2 size={13} />, 'rgba(255,59,48,0.12)', 'rgba(255,59,48,0.9)')}
          {iconBtn(() => setSelectedNodeId(null), <X size={14} />, t.btnHoverBg, t.btnHoverColor)}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 450, color: t.sectionLabel, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Label</label>
            <input type="text" value={label} onChange={(e) => updateNodeLabel(node.id, e.target.value)}
              style={{ width: '100%', padding: '8px 11px', borderRadius: 9, border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.inputColor, fontSize: 13, outline: 'none', transition: 'border 0.15s, background 0.15s', fontFamily: 'inherit' }}
              onFocus={(e) => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.background = t.inputFocusBg }}
              onBlur={(e) => { e.target.style.borderColor = t.inputBorder; e.target.style.background = t.inputBg }} />
          </div>

          {fields.length === 0 && (
            <div style={{ padding: '14px 12px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.cardBg, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: t.textTertiary, margin: 0 }}>No configuration required</p>
            </div>
          )}

          {fields.map((field) => {
            const val = config[field.key]
            if (field.type === 'json') return <JsonField key={field.key} fieldKey={field.key} label={field.label} placeholder={field.placeholder} value={val} onChange={handleField} />
            if (field.type === 'select') return (
              <div key={field.key}>
                <label style={{ fontSize: 11, fontWeight: 450, color: t.sectionLabel, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{field.label}</label>
                <select value={(val as string) ?? ''} onChange={(e) => handleField(field.key, e.target.value)}
                  style={{ width: '100%', padding: '8px 11px', borderRadius: 9, border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.inputColor, fontSize: 13, outline: 'none', cursor: 'pointer', transition: 'border 0.15s', fontFamily: 'inherit' }}
                  onFocus={(e) => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.background = t.inputFocusBg }}
                  onBlur={(e) => { e.target.style.borderColor = t.inputBorder; e.target.style.background = t.inputBg }}>
                  <option value="">Select…</option>
                  {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )
            if (field.type === 'number') return <NumberField key={field.key} fieldKey={field.key} label={field.label} placeholder={field.placeholder} value={val} min={field.min} max={field.max} onChange={handleField} />
            return (
              <div key={field.key}>
                <label style={{ fontSize: 11, fontWeight: 450, color: t.sectionLabel, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{field.label}</label>
                <input type="text" value={(val as string) ?? ''} onChange={(e) => handleField(field.key, e.target.value || undefined)} placeholder={field.placeholder}
                  style={{ width: '100%', padding: '8px 11px', borderRadius: 9, border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.inputColor, fontSize: 13, outline: 'none', transition: 'border 0.15s, background 0.15s', fontFamily: 'inherit' }}
                  onFocus={(e) => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.background = t.inputFocusBg }}
                  onBlur={(e) => { e.target.style.borderColor = t.inputBorder; e.target.style.background = t.inputBg }} />
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '12px 14px', borderTop: `1px solid ${t.divider}`, flexShrink: 0 }}>
        <div style={{ padding: '8px 10px', borderRadius: 9, background: `${color}0d`, border: `1px solid ${color}1e` }}>
          <p style={{ fontSize: 10, fontWeight: 500, color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Node ID</p>
          <p style={{ fontSize: 11, color: t.textTertiary, margin: 0, fontFamily: 'ui-monospace,monospace', wordBreak: 'break-all' }}>{node.id}</p>
        </div>
      </div>
    </aside>
  )
}
