'use client'

import { memo } from 'react'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { Clock } from 'lucide-react'
import type { DelayNodeData } from '@/lib/whatsapp-flow-canvas-converter'

export const DelayNode = memo(function DelayNode({ data }: NodeProps<Node<DelayNodeData & Record<string, unknown>, 'delay'>>) {
  const ms = data.delayMs || 500
  const label = ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`
  return (
    <div className="px-4 py-3 bg-white border-2 border-slate-200 rounded-lg shadow min-w-[140px]">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !left-[-6px] !bg-teal-500" />
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span className="font-medium text-sm text-gray-800">Delay</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !right-[-6px] !bg-teal-500" />
    </div>
  )
})
