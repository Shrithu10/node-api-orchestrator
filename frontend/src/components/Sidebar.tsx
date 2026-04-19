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
      className="group flex cursor-grab items-start gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-3 transition-all duration-100 hover:border-white/10 hover:bg-white/[0.07] active:cursor-grabbing"
    >
      <div
        style={{ background: `${def.color}20`, color: def.color }}
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
      >
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/90">{def.label}</p>
        <p className="mt-0.5 text-[11px] leading-tight text-white/40">{def.description}</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-white/5 bg-[#12131c]">
      <div className="border-b border-white/5 px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
          Node Palette
        </p>
        <p className="mt-0.5 text-xs text-white/20">Drag nodes onto the canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {NODE_TYPE_DEFINITIONS.map((def) => (
            <SidebarItem key={def.type} def={def} />
          ))}
        </div>
      </div>

      <div className="border-t border-white/5 px-4 py-3">
        <p className="text-[10px] text-white/20">
          Connect nodes by dragging from a source handle (bottom) to a target handle (top).
        </p>
      </div>
    </aside>
  )
}
