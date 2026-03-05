'use client'

import { memo } from 'react'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { Zap } from 'lucide-react'
import type { TriggerNodeData } from '@/lib/whatsapp-flow-canvas-converter'

export const TriggerNode = memo(function TriggerNode({ data }: NodeProps<Node<TriggerNodeData & Record<string, unknown>, 'trigger'>>) {
  const label =
    data.triggerType === 'first_message'
      ? 'First message'
      : data.triggerType === 'keyword'
        ? `Keyword${data.keywords?.length ? `: ${data.keywords?.slice(0, 2).join(', ')}` : ''}`
        : data.triggerType === 'button_click'
          ? `Button: ${data.buttonPayload || '?'}`
          : 'Any message'

  return (
    <div className="px-4 py-3 bg-teal-600 text-white rounded-lg shadow-lg min-w-[160px]">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium text-sm">Trigger</span>
      </div>
      <p className="text-xs text-teal-100 mt-1 truncate">{label}</p>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !right-[-6px] !bg-white" />
    </div>
  )
})
