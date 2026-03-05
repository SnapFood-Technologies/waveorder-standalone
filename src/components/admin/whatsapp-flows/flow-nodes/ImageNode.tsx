'use client'

import { memo } from 'react'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { Image } from 'lucide-react'
import type { ImageNodeData } from '@/lib/whatsapp-flow-canvas-converter'

export const ImageNode = memo(function ImageNode({ data }: NodeProps<Node<ImageNodeData & Record<string, unknown>, 'image'>>) {
  const hasUrl = !!(data.mediaUrl && data.mediaUrl.trim())
  return (
    <div className="px-4 py-3 bg-white border-2 border-amber-200 rounded-lg shadow min-w-[180px]">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !left-[-6px] !bg-teal-500" />
      <div className="flex items-center gap-2">
        <Image className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="font-medium text-sm text-gray-800">Image</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{hasUrl ? '✓ Image set' : 'No image'}</p>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !right-[-6px] !bg-teal-500" />
    </div>
  )
})
