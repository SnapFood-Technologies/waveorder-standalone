'use client'

import { memo } from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Link } from 'lucide-react'
import type { UrlNodeData } from '@/lib/whatsapp-flow-canvas-converter'

export const UrlNode = memo(function UrlNode({ data }: NodeProps<UrlNodeData>) {
  const preview = (data.url || 'URL...').slice(0, 35)
  return (
    <div className="px-4 py-3 bg-white border-2 border-blue-200 rounded-lg shadow min-w-[180px]">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !left-[-6px] !bg-teal-500" />
      <div className="flex items-center gap-2">
        <Link className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="font-medium text-sm text-gray-800">URL</span>
      </div>
      <p className="text-xs text-gray-500 mt-1 truncate">{preview}{preview.length >= 35 ? '…' : ''}</p>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !right-[-6px] !bg-teal-500" />
    </div>
  )
})
