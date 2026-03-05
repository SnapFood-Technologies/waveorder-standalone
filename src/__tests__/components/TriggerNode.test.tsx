import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TriggerNode } from '@/components/admin/whatsapp-flows/flow-nodes/TriggerNode'

vi.mock('@xyflow/react', () => ({
  Handle: ({ position }: { position: string }) => <span data-testid="handle" data-position={position} />,
  Position: { Right: 'right' }
}))

describe('TriggerNode', () => {
  it('renders First message label for first_message trigger', () => {
    render(
      <TriggerNode
        data={{
          triggerType: 'first_message',
          keywords: undefined,
          buttonPayload: undefined
        }}
        id="1"
        selected={false}
        xPos={0}
        yPos={0}
        dragHandle={null}
      />
    )
    expect(screen.getByText('First message')).toBeTruthy()
  })

  it('renders Keyword label with keywords', () => {
    render(
      <TriggerNode
        data={{
          triggerType: 'keyword',
          keywords: ['menu', 'catalog'],
          buttonPayload: undefined
        }}
        id="1"
        selected={false}
        xPos={0}
        yPos={0}
        dragHandle={null}
      />
    )
    expect(screen.getByText(/Keyword: menu, catalog/)).toBeTruthy()
  })
})
