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
        borderColor: selected ? color : 'rgba(255,255,255,0.08)',
        boxShadow: selected ? `0 0 0 2px ${color}40, 0 4px 24px rgba(0,0,0,0.4)` : '0 2px 12px rgba(0,0,0,0.3)',
      }}
      className="min-w-[180px] max-w-[220px] rounded-xl border-2 bg-[#1a1d27] transition-all duration-150 cursor-default"
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: color,
          border: '2px solid #1a1d27',
          width: 10,
          height: 10,
        }}
      />

      <div
        style={{ background: `${color}20`, borderBottom: `1px solid ${color}30` }}
        className="flex items-center gap-2 rounded-t-xl px-3 py-2"
      >
        <span
          style={{ background: color }}
          className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
        />
        <span
          style={{ color }}
          className="truncate text-[10px] font-semibold uppercase tracking-widest"
        >
          {typeLabel}
        </span>
      </div>

      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-medium text-white/90">{data.label}</p>
        {data.config.url && (
          <p className="mt-0.5 truncate text-[11px] text-white/40">{data.config.url}</p>
        )}
        {data.config.method && (
          <span
            style={{ color, borderColor: `${color}40`, background: `${color}15` }}
            className="mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold"
          >
            {data.config.method}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: color,
          border: '2px solid #1a1d27',
          width: 10,
          height: 10,
        }}
      />
    </div>
  )
}

export const WorkflowNode = memo(WorkflowNodeComponent)
