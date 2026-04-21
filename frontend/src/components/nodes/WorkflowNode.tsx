import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { NODE_COLOR, NODE_LABEL } from '../../constants/nodeTypes'
import type { WorkflowNode as WorkflowNodeType } from '../../store/workflowStore'

function WorkflowNodeComponent({ data, selected }: NodeProps<WorkflowNodeType>) {
  const color = NODE_COLOR[data.nodeType]
  const typeLabel = NODE_LABEL[data.nodeType]

  return (
    <div
      style={{
        minWidth: 172,
        maxWidth: 220,
        borderRadius: 12,
        background: '#1c1c1e',
        border: selected
          ? `1px solid ${color}55`
          : '1px solid rgba(255,255,255,0.09)',
        boxShadow: selected
          ? `0 0 0 3px ${color}18, 0 8px 32px rgba(0,0,0,0.5)`
          : '0 2px 16px rgba(0,0,0,0.45)',
        transition: 'border 0.15s, box-shadow 0.15s',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: color,
          border: '2px solid #1c1c1e',
          width: 9,
          height: 9,
          top: -5,
        }}
      />

      {/* Color strip + type label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 11px 7px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            opacity: 0.9,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: color,
            opacity: 0.85,
          }}
        >
          {typeLabel}
        </span>
      </div>

      {/* Label + metadata */}
      <div style={{ padding: '8px 11px 9px' }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.88)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.label}
        </p>

        {data.config.url && (
          <p
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.32)',
              margin: '3px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data.config.url as string}
          </p>
        )}

        {data.config.method && (
          <span
            style={{
              display: 'inline-block',
              marginTop: 5,
              padding: '2px 6px',
              borderRadius: 5,
              background: `${color}18`,
              border: `1px solid ${color}30`,
              color: color,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.03em',
            }}
          >
            {data.config.method as string}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: color,
          border: '2px solid #1c1c1e',
          width: 9,
          height: 9,
          bottom: -5,
        }}
      />
    </div>
  )
}

export const WorkflowNode = memo(WorkflowNodeComponent)
