'use client'

import { memo } from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { MessageSquare } from 'lucide-react'
import type { MessageNodeData } from '@/lib/whatsapp-flow-canvas-converter'

export const MessageNode = memo(function MessageNode({ data }: NodeProps<MessageNodeData>) {
  const preview = (data.body || 'Message...').slice(0, 40)
  return (
    <div className="px-4 py-3 bg-white border-2 border-gray-300 rounded-lg shadow min-w-[180px]">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !left-[-6px] !bg-teal-500" />
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="font-medium text-sm text-gray-800">Message</span>
      </div>
      <p className="text-xs text-gray-500 mt-1 truncate">{preview}{preview.length >= 40 ? '…' : ''}</p>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !right-[-6px] !bg-teal-500" />
    </div>
  )
})
