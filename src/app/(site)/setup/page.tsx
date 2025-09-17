
// app/site/setup/page.tsx
import type { Metadata } from 'next'
import SetupComponent from '@/components/setup/Setup'

export const metadata: Metadata = {
  title: 'Setup - WaveOrder | Create Your Store',
  description: 'Set up your WhatsApp ordering system for your restaurant. Configure your menu, delivery options, and start accepting orders.',
  robots: {
    index: false, // Don't index setup pages
    follow: false,
  }
}

export default function Setup() {
  return <SetupComponent />
}