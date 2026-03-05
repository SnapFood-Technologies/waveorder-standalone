'use client'

import { memo } from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import type { ConditionNodeData } from '@/lib/whatsapp-flow-canvas-converter'

export const ConditionNode = memo(function ConditionNode({ data }: NodeProps<ConditionNodeData>) {
  const label =
    data.conditionType === 'keyword_match'
      ? `Keyword${data.keywords?.length ? `: ${data.keywords?.slice(0, 2).join(', ')}` : ''}`
      : 'Business hours?'
  return (
    <div className="px-4 py-3 bg-amber-100 border-2 border-amber-400 rounded-lg shadow min-w-[160px]">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !left-[-6px] !bg-teal-500" />
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-amber-700 flex-shrink-0" />
        <span className="font-medium text-sm text-amber-900">Condition</span>
      </div>
      <p className="text-xs text-amber-800 mt-1 truncate">{label}</p>
      <Handle type="source" position={Position.Right} id="true" className="!w-3 !h-3 !right-[-6px] !top-[30%] !bg-green-500" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Right} id="false" className="!w-3 !h-3 !right-[-6px] !top-[70%] !bg-red-500" style={{ top: '70%' }} />
    </div>
  )
})
