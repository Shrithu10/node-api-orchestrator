import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Globe, Shuffle, Filter, Merge, Clock, Minus, type LucideIcon } from 'lucide-react'
import { NODE_COLOR, NODE_LABEL } from '../../constants/nodeTypes'
import type { WorkflowNode as WorkflowNodeType } from '../../store/workflowStore'
import { useTheme } from '../../hooks/useTheme'
import type { NodeType } from '../../types'

const ICONS: Record<NodeType, LucideIcon> = {
  http_request: Globe, transform: Shuffle, filter: Filter,
  merge: Merge, delay: Clock, noop: Minus,
}

function WorkflowNodeComponent({ data, selected }: NodeProps<WorkflowNodeType>) {
  const color = NODE_COLOR[data.nodeType]
  const t = useTheme()
  const Icon = ICONS[data.nodeType]
  const isLight = t.theme === 'light'

  return (
    <div style={{
      minWidth: 192,
      maxWidth: 248,
      borderRadius: 16,
      background: t.nodeBg,
      border: `1.5px solid ${selected ? color : t.nodeBorder}`,
      boxShadow: selected
        ? t.nodeSelectedShadow(color)
        : isLight
          ? '0 2px 6px rgba(0,0,0,0.07), 0 10px 28px rgba(0,0,0,0.09)'
          : '0 4px 16px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      overflow: 'hidden',
      cursor: 'default',
    }}>
      <Handle
        type="target" position={Position.Top}
        style={{ background: color, border: `3px solid ${t.handleBorder}`, width: 12, height: 12, top: -6 }}
      />

      {/* Gradient header */}
      <div style={{
        padding: '11px 14px 10px',
        background: isLight
          ? `linear-gradient(135deg, ${color}22 0%, ${color}0a 100%)`
          : `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
        borderBottom: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', gap: 9,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9,
          background: isLight ? `${color}22` : `${color}28`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 2px 8px ${color}30`,
        }}>
          <Icon size={13} style={{ color }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color, margin: 0, letterSpacing: '0.01em' }}>
            {NODE_LABEL[data.nodeType]}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px 13px' }}>
        <p style={{
          fontSize: 14, fontWeight: 450, color: t.textPrimary,
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}>
          {data.label}
        </p>

        {data.config.url && (
          <p style={{
            fontSize: 11, color: t.textTertiary,
            margin: '5px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'ui-monospace, monospace',
          }}>
            {data.config.url as string}
          </p>
        )}

        {data.config.method && (
          <span style={{
            display: 'inline-block', marginTop: 7,
            padding: '3px 8px', borderRadius: 7,
            background: `${color}20`, border: `1px solid ${color}38`,
            color, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em',
          }}>
            {data.config.method as string}
          </span>
        )}

        {data.config.seconds != null && (
          <p style={{ fontSize: 12, color: t.textTertiary, margin: '6px 0 0', fontWeight: 500 }}>
            ⏱ {String(data.config.seconds)}s
          </p>
        )}
      </div>

      <Handle
        type="source" position={Position.Bottom}
        style={{ background: color, border: `3px solid ${t.handleBorder}`, width: 12, height: 12, bottom: -6 }}
      />
    </div>
  )
}

export const WorkflowNode = memo(WorkflowNodeComponent)
