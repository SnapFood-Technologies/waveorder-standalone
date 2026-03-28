import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StorefrontOrderSubmitButton } from '@/components/storefront/StorefrontOrderSubmitButton'

describe('StorefrontOrderSubmitButton', () => {
  const baseProps = {
    submitOrder: vi.fn(),
    orderButtonLabel: 'Place order',
    orderFooterHint: '',
    backgroundColor: '#0D9488',
  }

  it('disables the button when canSubmitOrder returns false', () => {
    render(<StorefrontOrderSubmitButton {...baseProps} canSubmitOrder={() => false} />)
    expect((screen.getByTestId('storefront-order-submit') as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables the button when canSubmitOrder returns true', () => {
    render(<StorefrontOrderSubmitButton {...baseProps} canSubmitOrder={() => true} />)
    expect((screen.getByTestId('storefront-order-submit') as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls submitOrder when clicked and enabled', () => {
    const submitOrder = vi.fn()
    render(
      <StorefrontOrderSubmitButton
        {...baseProps}
        submitOrder={submitOrder}
        canSubmitOrder={() => true}
      />
    )
    fireEvent.click(screen.getByTestId('storefront-order-submit'))
    expect(submitOrder).toHaveBeenCalledTimes(1)
  })

  it('renders orderButtonLabel and orderFooterHint', () => {
    render(
      <StorefrontOrderSubmitButton
        {...baseProps}
        canSubmitOrder={() => true}
        orderButtonLabel="Send via WhatsApp"
        orderFooterHint="Complete checkout in chat"
      />
    )
    expect(screen.getByText('Send via WhatsApp')).toBeTruthy()
    expect(screen.getByText('Complete checkout in chat')).toBeTruthy()
  })
})
