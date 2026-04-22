import { Globe, Shuffle, Filter, Merge, Clock, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NODE_TYPE_DEFINITIONS } from '../constants/nodeTypes'
import type { NodeType, NodeTypeDefinition } from '../types'
import { useTheme } from '../hooks/useTheme'

const ICONS: Record<NodeType, LucideIcon> = {
  http_request: Globe, transform: Shuffle, filter: Filter,
  merge: Merge, delay: Clock, noop: Minus,
}

function SidebarItem({ def }: { def: NodeTypeDefinition }) {
  const Icon = ICONS[def.type]
  const t = useTheme()
  const isLight = t.theme === 'light'

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify({ type: def.type, label: def.label, defaultConfig: def.defaultConfig }))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div draggable onDragStart={onDragStart}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 12,
        border: '1px solid transparent',
        cursor: 'grab', transition: 'all 0.15s', userSelect: 'none',
        marginBottom: 3,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = isLight ? `${def.color}10` : `${def.color}12`
        el.style.borderColor = `${def.color}30`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'transparent'
        el.style.borderColor = 'transparent'
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: isLight ? `${def.color}18` : `${def.color}22`,
        border: `1px solid ${def.color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: def.color,
        boxShadow: `0 2px 10px ${def.color}25`,
      }}>
        <Icon size={15} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
          {def.label}
        </p>
        <p style={{ fontSize: 11, color: t.textTertiary, margin: '2px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {def.description}
        </p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const t = useTheme()
  const isLight = t.theme === 'light'

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      display: 'flex', flexDirection: 'column', height: '100%',
      background: t.sidebarBg,
      borderRight: `1px solid ${t.sidebarBorder}`,
      boxShadow: isLight ? '4px 0 20px rgba(0,0,0,0.06)' : 'none',
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      <div style={{ padding: '20px 16px 12px' }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: t.sectionLabel, letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
          Nodes
        </p>
        <p style={{ fontSize: 12, color: t.textMuted, margin: '4px 0 0', fontWeight: 500 }}>
          Drag to add to canvas
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 8px 12px' }}>
        {NODE_TYPE_DEFINITIONS.map((def) => <SidebarItem key={def.type} def={def} />)}
      </div>

      <div style={{ padding: '14px 16px', borderTop: `1px solid ${t.divider}` }}>
        <p style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.6, margin: 0 }}>
          Connect bottom → top handles to wire nodes together
        </p>
      </div>
    </aside>
  )
}
