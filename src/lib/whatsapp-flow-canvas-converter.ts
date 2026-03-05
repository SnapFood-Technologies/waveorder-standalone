/**
 * Converts between Visual Flow Builder canvas data and flow engine format (trigger + steps).
 * Flow engine format is used at runtime; canvas format is used in the visual editor.
 */

import type { Node, Edge } from '@xyflow/react'
import type { FlowTrigger, FlowStep } from './whatsapp-flow-engine'

// --- Canvas node/edge types ---

export type CanvasNodeType =
  | 'trigger'
  | 'message'
  | 'image'
  | 'url'
  | 'location'
  | 'notify'
  | 'delay'
  | 'condition'

export interface TriggerNodeData {
  triggerType: 'first_message' | 'keyword' | 'button_click' | 'any_message'
  keywords?: string[]
  buttonPayload?: string
  businessHoursOnly?: boolean
  outsideHoursOnly?: boolean
}

export interface MessageNodeData {
  body: string
}

export interface ImageNodeData {
  body?: string
  mediaUrl?: string
}

export interface UrlNodeData {
  body?: string
  url?: string
}

export interface LocationNodeData {
  name?: string
  address?: string
  body?: string
}

export interface NotifyNodeData {
  message?: string
}

export interface DelayNodeData {
  delayMs?: number
}

export interface ConditionNodeData {
  conditionType: 'keyword_match' | 'business_hours'
  keywords?: string[]
}

export type FlowNodeData =
  | TriggerNodeData
  | MessageNodeData
  | ImageNodeData
  | UrlNodeData
  | LocationNodeData
  | NotifyNodeData
  | DelayNodeData
  | ConditionNodeData

export type FlowCanvasNode = Node<FlowNodeData, CanvasNodeType>
export type FlowCanvasEdge = Edge

// --- Canvas -> Engine conversion ---

/**
 * Convert canvas nodes + edges to trigger + steps for the flow engine.
 * Traverses from trigger node, follows edges, collects steps in order.
 * Condition nodes create nested condition steps with true/false branches.
 */
export function canvasToFlow(
  nodes: FlowCanvasNode[],
  edges: FlowCanvasEdge[]
): { trigger: FlowTrigger; steps: FlowStep[] } {
  const triggerNode = nodes.find((n) => n.type === 'trigger')
  if (!triggerNode || !triggerNode.data) {
    return {
      trigger: { type: 'first_message' },
      steps: []
    }
  }

  const triggerData = triggerNode.data as TriggerNodeData
  const trigger: FlowTrigger = {
    type: triggerData.triggerType,
    keywords: triggerData.keywords,
    buttonPayload: triggerData.buttonPayload,
    businessHoursOnly: triggerData.businessHoursOnly,
    outsideHoursOnly: triggerData.outsideHoursOnly
  }

  const steps = traverseFromNode(triggerNode.id, nodes, edges, new Set<string>())
  return { trigger, steps }
}

function traverseFromNode(
  nodeId: string,
  nodes: FlowCanvasNode[],
  edges: FlowCanvasEdge[],
  visited: Set<string>
): FlowStep[] {
  if (visited.has(nodeId)) return []
  visited.add(nodeId)

  const node = nodes.find((n) => n.id === nodeId)
  if (!node || !node.data) return []

  const outgoing = edges.filter((e) => e.source === nodeId)
  const steps: FlowStep[] = []

  // Convert this node to step(s)
  switch (node.type) {
    case 'trigger':
      // Trigger is not a step; just traverse output
      break
    case 'message': {
      const d = node.data as MessageNodeData
      steps.push({ type: 'send_text', body: d.body || '' })
      break
    }
    case 'image': {
      const d = node.data as ImageNodeData
      steps.push({ type: 'send_image', body: d.body, mediaUrl: d.mediaUrl })
      break
    }
    case 'url': {
      const d = node.data as UrlNodeData
      steps.push({ type: 'send_url', body: d.body, url: d.url })
      break
    }
    case 'location': {
      const d = node.data as LocationNodeData
      steps.push({
        type: 'send_location',
        name: d.name,
        address: d.address,
        body: d.body
      })
      break
    }
    case 'notify': {
      const d = node.data as NotifyNodeData
      steps.push({ type: 'notify_team', message: d.message || 'Customer needs help' })
      break
    }
    case 'delay': {
      const d = node.data as DelayNodeData
      const ms = typeof d.delayMs === 'number' && d.delayMs > 0 ? Math.min(d.delayMs, 5000) : 500
      steps.push({ type: 'delay', delayMs: ms })
      break
    }
    case 'condition': {
      const d = node.data as ConditionNodeData
      const trueEdge = outgoing.find((e) => e.sourceHandle === 'true' || !e.sourceHandle)
      const falseEdge = outgoing.find((e) => e.sourceHandle === 'false')
      const trueTarget = trueEdge?.target
      const falseTarget = falseEdge?.target

      const trueSteps = trueTarget
        ? traverseFromNode(trueTarget, nodes, edges, new Set(visited))
        : []
      const falseSteps = falseTarget
        ? traverseFromNode(falseTarget, nodes, edges, new Set(visited))
        : []

      steps.push({
        type: 'condition',
        conditionType: d.conditionType,
        keywords: d.keywords,
        trueSteps,
        falseSteps
      })
      return steps // Condition consumes its branches
    }
    default:
      break
  }

  // For non-condition nodes, follow the single output edge
  const nextEdge = outgoing[0]
  if (nextEdge) {
    steps.push(...traverseFromNode(nextEdge.target, nodes, edges, visited))
  }

  return steps
}

// --- Engine -> Canvas conversion ---

/**
 * Convert trigger + steps to initial canvas nodes + edges for the visual editor.
 * Creates a linear flow: trigger -> step1 -> step2 -> ...
 */
export function flowToCanvas(
  trigger: FlowTrigger,
  steps: FlowStep[],
  flowName: string
): { nodes: FlowCanvasNode[]; edges: FlowCanvasEdge[] } {
  const nodes: FlowCanvasNode[] = []
  const edges: FlowCanvasEdge[] = []

  const triggerData: TriggerNodeData = {
    triggerType: trigger.type,
    keywords: trigger.keywords,
    buttonPayload: trigger.buttonPayload,
    businessHoursOnly: trigger.businessHoursOnly,
    outsideHoursOnly: trigger.outsideHoursOnly
  }

  nodes.push({
    id: 'trigger',
    type: 'trigger',
    position: { x: 100, y: 150 },
    data: triggerData
  })

  let prevId = 'trigger'
  let y = 150

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const id = `step-${i}`

    if ((step as FlowStep & { type: string }).type === 'condition') {
      const cond = step as FlowStep & {
        conditionType?: string
        keywords?: string[]
        trueSteps?: FlowStep[]
        falseSteps?: FlowStep[]
      }
      nodes.push({
        id,
        type: 'condition',
        position: { x: 350 + i * 220, y },
        data: {
          conditionType: (cond.conditionType as ConditionNodeData['conditionType']) || 'keyword_match',
          keywords: cond.keywords
        }
      })
      edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })

      // Add true branch (firstPrevId = condition node id so first edge goes condition -> first step)
      if (cond.trueSteps?.length) {
        const { nodes: trueNodes, edges: trueEdges } = stepsToCanvasNodes(cond.trueSteps, 350 + i * 220 + 200, y - 80, id)
        nodes.push(...trueNodes)
        const firstEdge = trueEdges.find((e) => e.source === id)
        if (firstEdge) firstEdge.sourceHandle = 'true'
        edges.push(...trueEdges)
      }
      // Add false branch
      if (cond.falseSteps?.length) {
        const { nodes: falseNodes, edges: falseEdges } = stepsToCanvasNodes(cond.falseSteps, 350 + i * 220 + 200, y + 80, id)
        nodes.push(...falseNodes)
        const firstEdge = falseEdges.find((e) => e.source === id)
        if (firstEdge) firstEdge.sourceHandle = 'false'
        edges.push(...falseEdges)
      }

      prevId = id
    } else {
      const { node, edge } = stepToNode(step, id, 350 + i * 220, y, prevId)
      nodes.push(node)
      if (edge) edges.push(edge)
      prevId = id
    }
    y += 120
  }

  return { nodes, edges }
}

function stepToNode(
  step: FlowStep,
  id: string,
  x: number,
  y: number,
  prevId: string
): { node: FlowCanvasNode; edge: FlowCanvasEdge | null } {
  const edge: FlowCanvasEdge = { id: `e-${prevId}-${id}`, source: prevId, target: id }

  switch (step.type) {
    case 'delay':
      return {
        node: {
          id,
          type: 'delay',
          position: { x, y },
          data: { delayMs: step.delayMs || 500 }
        },
        edge
      }
    case 'send_text':
      if (step.delayMs) {
        return {
          node: {
            id,
            type: 'delay',
            position: { x, y },
            data: { delayMs: step.delayMs }
          },
          edge
        }
      }
      return {
        node: {
          id,
          type: 'message',
          position: { x, y },
          data: { body: step.body || '' }
        },
        edge
      }
    case 'send_image':
      return {
        node: {
          id,
          type: 'image',
          position: { x, y },
          data: { body: step.body, mediaUrl: step.mediaUrl }
        },
        edge
      }
    case 'send_url':
      return {
        node: {
          id,
          type: 'url',
          position: { x, y },
          data: { body: step.body, url: step.url }
        },
        edge
      }
    case 'send_location':
      return {
        node: {
          id,
          type: 'location',
          position: { x, y },
          data: { name: step.name, address: step.address, body: step.body }
        },
        edge
      }
    case 'notify_team':
      return {
        node: {
          id,
          type: 'notify',
          position: { x, y },
          data: { message: step.message || step.body }
        },
        edge
      }
    default:
      return {
        node: { id, type: 'message', position: { x, y }, data: { body: '' } },
        edge
      }
  }
}

function stepsToCanvasNodes(
  steps: FlowStep[],
  startX: number,
  startY: number,
  firstPrevId: string
): { nodes: FlowCanvasNode[]; edges: FlowCanvasEdge[] } {
  const nodes: FlowCanvasNode[] = []
  const edges: FlowCanvasEdge[] = []
  let prevId = firstPrevId

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const id = `step-branch-${firstPrevId}-${i}`
    const { node, edge } = stepToNode(step, id, startX + i * 200, startY, prevId)
    nodes.push(node)
    if (edge) edges.push(edge)
    prevId = id
  }

  return { nodes, edges }
}
