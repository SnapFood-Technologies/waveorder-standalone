// src/app/site/cookies/page.tsx
import Cookies from '@/components/site/Cookies'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy - How WaveOrder Uses Cookies and Tracking',
  description: 'Learn about cookies and tracking technologies used by WaveOrder WhatsApp ordering platform. Manage your cookie preferences and understand data collection.',
  keywords: 'waveorder cookie policy, tracking technologies, cookie preferences, web analytics',
  alternates: {
    canonical: 'https://waveorder.app/cookies',
  },
  openGraph: {
    title: 'WaveOrder Cookie Policy - Tracking Technologies and Preferences',
    description: 'Information about cookies and tracking technologies used on WaveOrder platform.',
    type: 'website',
    url: 'https://waveorder.app/cookies',
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function CookiesPage() {
  return <Cookies />
}