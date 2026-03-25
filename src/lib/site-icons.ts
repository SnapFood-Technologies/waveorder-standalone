import type { Metadata } from 'next'

/**
 * Default WaveOrder icon metadata for root layout and storefront pages
 * when the business has no custom favicon. Files live in /public.
 */
export const waveOrderDefaultIcons: NonNullable<Metadata['icons']> = {
  icon: [
    { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    { url: '/favicon.ico', sizes: 'any' },
  ],
  shortcut: '/favicon.ico',
  apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
}
