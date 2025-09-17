// src/app/site/terms/page.tsx
import Terms from '@/components/site/Terms'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - WaveOrder Platform Agreement',
  description: 'Terms and conditions for using WaveOrder WhatsApp ordering platform. Legal agreement covering service usage, responsibilities, and limitations.',
  keywords: 'waveorder terms of service, legal agreement, platform terms, user agreement',
  alternates: {
    canonical: 'https://waveorder.app/terms',
  },
  openGraph: {
    title: 'WaveOrder Terms of Service - Platform Agreement',
    description: 'Legal terms and conditions for using the WaveOrder WhatsApp ordering platform.',
    type: 'website',
    url: 'https://waveorder.app/terms',
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function TermsPage() {
  return <Terms />
}