import { describe, it, expect } from 'vitest'
import { canvasToFlow, flowToCanvas } from '@/lib/whatsapp-flow-canvas-converter'

describe('canvasToFlow (Phase 3/5)', () => {
  it('returns default trigger when no trigger node', () => {
    const result = canvasToFlow([], [])
    expect(result.trigger.type).toBe('first_message')
    expect(result.steps).toEqual([])
  })

  it('converts trigger + message to steps', () => {
    const nodes = [
      { id: 't1', type: 'trigger' as const, data: { triggerType: 'keyword' as const, keywords: ['menu'] }, position: { x: 0, y: 0 } },
      { id: 'm1', type: 'message' as const, data: { body: 'Here is our menu' }, position: { x: 0, y: 100 } }
    ]
    const edges = [{ id: 'e1', source: 't1', target: 'm1' }]
    const result = canvasToFlow(nodes, edges)
    expect(result.trigger.type).toBe('keyword')
    expect(result.trigger.keywords).toEqual(['menu'])
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0]).toEqual({ type: 'send_text', body: 'Here is our menu' })
  })

  it('converts delay node with clamp', () => {
    const nodes = [
      { id: 't1', type: 'trigger' as const, data: { triggerType: 'first_message' }, position: { x: 0, y: 0 } },
      { id: 'd1', type: 'delay' as const, data: { delayMs: 10000 }, position: { x: 0, y: 50 } }
    ]
    const edges = [{ id: 'e1', source: 't1', target: 'd1' }]
    const result = canvasToFlow(nodes, edges)
    expect(result.steps[0].type).toBe('delay')
    expect((result.steps[0] as { delayMs?: number }).delayMs).toBe(5000) // clamped to 5s
  })
})

describe('flowToCanvas (Phase 3/5)', () => {
  it('converts trigger + steps to canvas nodes and edges', () => {
    const { nodes, edges } = flowToCanvas(
      { type: 'keyword', keywords: ['hello'] },
      [{ type: 'send_text', body: 'Hi!' }],
      'Test flow'
    )
    expect(nodes.some((n) => n.type === 'trigger')).toBe(true)
    expect(nodes.some((n) => n.type === 'message')).toBe(true)
    expect(edges.length).toBeGreaterThan(0)
  })
})
