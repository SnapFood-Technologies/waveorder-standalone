import type { ComponentProps } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { TriggerNodeData } from '@/lib/whatsapp-flow-canvas-converter'
import { TriggerNode } from '@/components/admin/whatsapp-flows/flow-nodes/TriggerNode'

vi.mock('@xyflow/react', () => ({
  Handle: ({ position }: { position: string }) => <span data-testid="handle" data-position={position} />,
  Position: { Right: 'right' }
}))

/** React Flow’s NodeProps is large; the component under test only uses `data`. */
function renderTrigger(data: TriggerNodeData & Record<string, unknown>) {
  return render(
    <TriggerNode
      {...({
        id: '1',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data,
        selected: false
      } as unknown as ComponentProps<typeof TriggerNode>)}
    />
  )
}

describe('TriggerNode', () => {
  it('renders First message label for first_message trigger', () => {
    renderTrigger({
      triggerType: 'first_message',
      keywords: undefined,
      buttonPayload: undefined
    })
    expect(screen.getByText('First message')).toBeTruthy()
  })

  it('renders Keyword label with keywords', () => {
    renderTrigger({
      triggerType: 'keyword',
      keywords: ['menu', 'catalog'],
      buttonPayload: undefined
    })
    expect(screen.getByText(/Keyword: menu, catalog/)).toBeTruthy()
  })
})
