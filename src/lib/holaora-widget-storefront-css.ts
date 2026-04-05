/**
 * Hola Ora’s embed script (chat.js) creates #holaora-widget-container with inline
 * bottom: 20px. Storefront scroll-to-top uses Tailwind bottom-10 (2.5rem) or
 * bottom-24 (6rem) — we override via injected stylesheet so the launcher lines up.
 */
export const HOLAORA_WIDGET_CONTAINER_SELECTOR = '#holaora-widget-container'

/** CSS block to inject: aligns Hola launcher bottom with storefront FAB. */
export function cssAlignHolaLauncherWithStorefrontFab(elevatedForCartOrBookingBar: boolean): string {
  const bottom = elevatedForCartOrBookingBar ? '6rem' : '2.5rem'
  return `${HOLAORA_WIDGET_CONTAINER_SELECTOR} { bottom: ${bottom} !important; }`
}
