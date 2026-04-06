import { describe, expect, it } from 'vitest'
import {
  cssAlignHolaLauncherWithStorefrontFab,
  HOLAORA_WIDGET_CONTAINER_SELECTOR,
} from '@/lib/holaora-widget-storefront-css'

describe('holaora-widget-storefront-css', () => {
  it('targets the official widget container id', () => {
    expect(HOLAORA_WIDGET_CONTAINER_SELECTOR).toBe('#holaora-widget-container')
  })

  it('uses 2.5rem when not elevated', () => {
    expect(cssAlignHolaLauncherWithStorefrontFab(false)).toContain('2.5rem')
    expect(cssAlignHolaLauncherWithStorefrontFab(false)).toContain('!important')
  })

  it('uses 6rem when elevated for cart/booking bar', () => {
    expect(cssAlignHolaLauncherWithStorefrontFab(true)).toContain('6rem')
  })
})
