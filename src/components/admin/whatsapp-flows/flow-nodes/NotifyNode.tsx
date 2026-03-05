'use client'

import { memo } from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Bell } from 'lucide-react'
import type { NotifyNodeData } from '@/lib/whatsapp-flow-canvas-converter'

export const NotifyNode = memo(function NotifyNode({ data }: NodeProps<NotifyNodeData>) {
  const preview = (data.message || 'Notify team').slice(0, 35)
  return (
    <div className="px-4 py-3 bg-white border-2 border-purple-200 rounded-lg shadow min-w-[180px]">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !left-[-6px] !bg-teal-500" />
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <span className="font-medium text-sm text-gray-800">Notify</span>
      </div>
      <p className="text-xs text-gray-500 mt-1 truncate">{preview}{preview.length >= 35 ? '…' : ''}</p>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !right-[-6px] !bg-teal-500" />
    </div>
  )
})
