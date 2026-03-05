'use client'

import { useCallback, useState, useMemo } from 'react'
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import {
  TriggerNode,
  MessageNode,
  ImageNode,
  UrlNode,
  LocationNode,
  NotifyNode,
  DelayNode,
  ConditionNode
} from './flow-nodes'

import {
  canvasToFlow,
  flowToCanvas,
  type FlowCanvasNode,
  type FlowCanvasEdge,
  type TriggerNodeData,
  type MessageNodeData,
  type ImageNodeData,
  type UrlNodeData,
  type LocationNodeData,
  type NotifyNodeData,
  type DelayNodeData,
  type ConditionNodeData
} from '@/lib/whatsapp-flow-canvas-converter'

import { Zap, MessageSquare, Image, Link, MapPin, Bell, Clock, GitBranch, Upload } from 'lucide-react'
import { generateId } from '@/lib/utils'

const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  image: ImageNode,
  url: UrlNode,
  location: LocationNode,
  notify: NotifyNode,
  delay: DelayNode,
  condition: ConditionNode
}

const NODE_TEMPLATES: Array<{ type: string; label: string; icon: typeof Zap; defaultData: object }> = [
  { type: 'trigger', label: 'Trigger', icon: Zap, defaultData: { triggerType: 'first_message' as const } },
  { type: 'message', label: 'Message', icon: MessageSquare, defaultData: { body: '' } },
  { type: 'image', label: 'Image', icon: Image, defaultData: { body: '', mediaUrl: '' } },
  { type: 'url', label: 'URL', icon: Link, defaultData: { body: '', url: '' } },
  { type: 'location', label: 'Location', icon: MapPin, defaultData: { name: '', address: '', body: '' } },
  { type: 'notify', label: 'Notify', icon: Bell, defaultData: { message: 'Customer needs help' } },
  { type: 'delay', label: 'Delay', icon: Clock, defaultData: { delayMs: 1000 } },
  { type: 'condition', label: 'Condition', icon: GitBranch, defaultData: { conditionType: 'keyword_match' as const, keywords: [] as string[] } }
]

export interface VisualFlowBuilderProps {
  initialTrigger?: { type: string; keywords?: string[]; buttonPayload?: string; businessHoursOnly?: boolean; outsideHoursOnly?: boolean }
  initialSteps?: Array<Record<string, unknown>>
  initialCanvas?: { nodes: FlowCanvasNode[]; edges: FlowCanvasEdge[] } | null
  flowName?: string
  storeUrl?: string
  businessId: string
  onSave: (payload: { name: string; type: string; trigger: object; steps: object[]; editorType: 'visual'; canvasData: object }) => void
  onCancel: () => void
  saving?: boolean
}

function generateNodeId(): string {
  return `node-${generateId(8)}`
}

function VisualFlowBuilderInner({
  initialTrigger,
  initialSteps,
  initialCanvas,
  flowName,
  storeUrl,
  businessId,
  onSave,
  onCancel,
  saving
}: VisualFlowBuilderProps) {
  const { screenToFlowPosition } = useReactFlow()

  const { initialNodes, initialEdges } = useMemo(() => {
    if (initialCanvas?.nodes?.length) {
      return {
        initialNodes: initialCanvas.nodes as Node[],
        initialEdges: initialCanvas.edges as Edge[]
      }
    }
    const trigger = initialTrigger || { type: 'first_message' }
    const steps = (initialSteps || []) as Array<{ type: string; body?: string; mediaUrl?: string; url?: string; name?: string; address?: string; message?: string; delayMs?: number }>
    const { nodes, edges } = flowToCanvas(
      trigger as Parameters<typeof flowToCanvas>[0],
      steps as Parameters<typeof flowToCanvas>[1],
      flowName || 'Flow'
    )
    return { initialNodes: nodes as Node[], initialEdges: edges as Edge[] }
  }, [initialCanvas, initialTrigger, initialSteps, flowName])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [name, setName] = useState(flowName || '')
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [uploadingForNode, setUploadingForNode] = useState<string | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => setSelectedNode(null), [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow') as string
      if (!type || !nodeTypes[type as keyof typeof nodeTypes]) return

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const template = NODE_TEMPLATES.find((t) => t.type === type)
      const defaultData: Record<string, unknown> = (template?.defaultData as Record<string, unknown>) ?? {}

      const newNode: Node = {
        id: generateNodeId(),
        type: type as keyof typeof nodeTypes,
        position,
        data: defaultData
      }
      setNodes((nds) => nds.concat(newNode))
    },
    [screenToFlowPosition, setNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleSave = useCallback(() => {
    if (!name.trim()) return
    const { trigger, steps } = canvasToFlow(nodes as FlowCanvasNode[], edges as FlowCanvasEdge[])
    const flowType =
      trigger.type === 'first_message' ? 'welcome' : trigger.type === 'any_message' ? 'away' : trigger.type === 'keyword' ? 'keyword' : 'button_reply'
    onSave({
      name: name.trim(),
      type: flowType,
      trigger,
      steps,
      editorType: 'visual',
      canvasData: { nodes, edges }
    })
  }, [name, nodes, edges, onSave])

  const updateNodeData = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
      )
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, ...data } } : null))
      }
    },
    [setNodes, selectedNode]
  )

  const handleImageUpload = useCallback(
    async (nodeId: string, file: File) => {
      if (!file.type.startsWith('image/')) return
      try {
        setUploadingForNode(nodeId)
        const form = new FormData()
        form.append('image', file)
        form.append('folder', 'flows')
        const res = await fetch(`/api/admin/stores/${businessId}/upload`, { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Upload failed')
        const url = data.imageUrl || data.publicUrl
        if (url) updateNodeData(nodeId, { mediaUrl: url })
      } finally {
        setUploadingForNode(null)
      }
    },
    [businessId, updateNodeData]
  )

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      <div className="flex-1 flex min-h-0">
        {/* Node panel */}
        <div className="w-48 border-r border-gray-200 bg-gray-50 p-3 flex flex-col gap-1 shrink-0">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Add node</p>
          {NODE_TEMPLATES.filter((t) => t.type !== 'trigger').map((t) => (
            <div
              key={t.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', t.type)
                e.dataTransfer.effectAllowed = 'move'
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-teal-50 cursor-grab text-sm"
            >
              <t.icon className="w-4 h-4 text-gray-500" />
              {t.label}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.6, minZoom: 0.25, maxZoom: 1 }}
            minZoom={0.2}
            maxZoom={2}
            className="bg-gray-100"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Properties panel */}
        <div className="w-72 border-l border-gray-200 bg-white overflow-y-auto shrink-0">
          <div className="p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Flow</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Flow name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
            />
            {selectedNode && (
              <>
                <hr className="my-4" />
                <p className="text-sm font-medium text-gray-700 mb-3">Node: {selectedNode.type}</p>
                <NodeProperties
                  node={selectedNode}
                  onUpdate={(data) => updateNodeData(selectedNode.id, data)}
                  onImageUpload={(file) => handleImageUpload(selectedNode.id, file)}
                  uploading={uploadingForNode === selectedNode.id}
                  storeUrl={storeUrl}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
        <span className="text-sm text-gray-500">
          {nodes.length} nodes · {edges.length} connections
        </span>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Flow'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface NodePropertiesProps {
  node: Node
  onUpdate: (data: Record<string, unknown>) => void
  onImageUpload: (file: File) => void
  uploading: boolean
  storeUrl?: string
}

function NodeProperties({ node, onUpdate, onImageUpload, uploading, storeUrl }: NodePropertiesProps) {
  const data = node.data || {}

  switch (node.type) {
    case 'trigger': {
      const d = data as unknown as TriggerNodeData
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={d.triggerType || 'first_message'}
              onChange={(e) => onUpdate({ triggerType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="first_message">First message</option>
              <option value="keyword">Keyword</option>
              <option value="button_click">Button click</option>
              <option value="any_message">Any message</option>
            </select>
          </div>
          {d.triggerType === 'keyword' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Keywords (comma)</label>
              <input
                type="text"
                value={(d.keywords || []).join(', ')}
                onChange={(e) =>
                  onUpdate({
                    keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                  })
                }
                placeholder="menu, catalog"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          )}
          {d.triggerType === 'button_click' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Button payload</label>
              <input
                type="text"
                value={d.buttonPayload || ''}
                onChange={(e) => onUpdate({ buttonPayload: e.target.value })}
                placeholder="order"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={d.businessHoursOnly || false}
              onChange={(e) => onUpdate({ businessHoursOnly: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-xs">During business hours only</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={d.outsideHoursOnly || false}
              onChange={(e) => onUpdate({ outsideHoursOnly: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-xs">Outside hours only</span>
          </label>
        </div>
      )
    }
    case 'message': {
      const d = data as unknown as MessageNodeData
      return (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Message</label>
          <textarea
            value={d.body || ''}
            onChange={(e) => onUpdate({ body: e.target.value })}
            placeholder="Type your message..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      )
    }
    case 'image': {
      const d = data as unknown as ImageNodeData
      return (
        <div className="space-y-2">
          <label className="block text-xs text-gray-500 mb-1">Caption</label>
          <textarea
            value={d.body || ''}
            onChange={(e) => onUpdate({ body: e.target.value })}
            placeholder="Optional caption"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <label className="block text-xs text-gray-500 mb-1">Image</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={d.mediaUrl || ''}
              onChange={(e) => onUpdate({ mediaUrl: e.target.value })}
              placeholder="URL or upload"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onImageUpload(f)
                  e.target.value = ''
                }}
                disabled={uploading}
              />
              {uploading ? '…' : <Upload className="w-4 h-4" />}
            </label>
          </div>
        </div>
      )
    }
    case 'url': {
      const d = data as unknown as UrlNodeData
      return (
        <div className="space-y-2">
          <label className="block text-xs text-gray-500 mb-1">URL</label>
          <input
            type="text"
            value={d.url || storeUrl || ''}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder={storeUrl || 'https://...'}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <label className="block text-xs text-gray-500 mb-1">Message (optional)</label>
          <input
            type="text"
            value={d.body || ''}
            onChange={(e) => onUpdate({ body: e.target.value })}
            placeholder="Text before URL"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      )
    }
    case 'location': {
      const d = data as unknown as LocationNodeData
      return (
        <div className="space-y-2">
          <label className="block text-xs text-gray-500 mb-1">Place name</label>
          <input
            type="text"
            value={d.name || ''}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Store name"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <label className="block text-xs text-gray-500 mb-1">Address</label>
          <input
            type="text"
            value={d.address || ''}
            onChange={(e) => onUpdate({ address: e.target.value })}
            placeholder="Full address"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <label className="block text-xs text-gray-500 mb-1">Message (optional)</label>
          <input
            type="text"
            value={d.body || ''}
            onChange={(e) => onUpdate({ body: e.target.value })}
            placeholder="Intro text"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      )
    }
    case 'notify': {
      const d = data as unknown as NotifyNodeData
      return (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Notification message</label>
          <input
            type="text"
            value={d.message || ''}
            onChange={(e) => onUpdate({ message: e.target.value })}
            placeholder="Customer needs help"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      )
    }
    case 'delay': {
      const d = data as unknown as DelayNodeData
      return (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Delay (ms)</label>
          <input
            type="number"
            value={d.delayMs ?? 1000}
            onChange={(e) => onUpdate({ delayMs: Math.min(5000, Math.max(0, parseInt(e.target.value, 10) || 0)) })}
            min={0}
            max={5000}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Max 5000ms</p>
        </div>
      )
    }
    case 'condition': {
      const d = data as unknown as ConditionNodeData
      return (
        <div className="space-y-2">
          <label className="block text-xs text-gray-500 mb-1">Condition type</label>
          <select
            value={d.conditionType || 'keyword_match'}
            onChange={(e) => onUpdate({ conditionType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="keyword_match">Keyword match</option>
            <option value="business_hours">Business hours</option>
          </select>
          {d.conditionType === 'keyword_match' && (
            <>
              <label className="block text-xs text-gray-500 mt-2">Keywords (comma)</label>
              <input
                type="text"
                value={(d.keywords || []).join(', ')}
                onChange={(e) =>
                  onUpdate({
                    keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                  })
                }
                placeholder="menu, catalog"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </>
          )}
        </div>
      )
    }
    default:
      return <p className="text-sm text-gray-500">Select a node to edit</p>
  }
}

export function VisualFlowBuilder(props: VisualFlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <VisualFlowBuilderInner {...props} />
    </ReactFlowProvider>
  )
}
