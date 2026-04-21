import { Globe, Shuffle, Filter, Merge, Clock, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NODE_TYPE_DEFINITIONS } from '../constants/nodeTypes'
import type { NodeType, NodeTypeDefinition } from '../types'

const ICONS: Record<NodeType, LucideIcon> = {
  http_request: Globe,
  transform: Shuffle,
  filter: Filter,
  merge: Merge,
  delay: Clock,
  noop: Minus,
}

function SidebarItem({ def }: { def: NodeTypeDefinition }) {
  const Icon = ICONS[def.type]

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ type: def.type, label: def.label, defaultConfig: def.defaultConfig }),
    )
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '9px 12px',
        borderRadius: 10,
        border: '1px solid transparent',
        cursor: 'grab',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(255,255,255,0.04)'
        el.style.border = '1px solid rgba(255,255,255,0.07)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'transparent'
        el.style.border = '1px solid transparent'
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${def.color}18`,
          border: `1px solid ${def.color}28`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: def.color,
          flexShrink: 0,
        }}
      >
        <Icon size={14} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.3 }}>
          {def.label}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {def.description}
        </p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside
      style={{
        width: 236,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(12,12,14,0.97)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 16px 10px' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>
          Nodes
        </p>
      </div>

      {/* Node list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 8px 8px' }}>
        {NODE_TYPE_DEFINITIONS.map((def) => (
          <SidebarItem key={def.type} def={def} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5, margin: 0 }}>
          Drag onto canvas, then connect handles to build a pipeline.
        </p>
      </div>
    </aside>
  )
}
