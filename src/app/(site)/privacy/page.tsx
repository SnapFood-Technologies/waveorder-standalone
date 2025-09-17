// src/app/site/privacy/page.tsx
import Privacy from '@/components/site/Privacy'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - How WaveOrder Protects Your Data',
  description: 'Learn how WaveOrder collects, uses, and protects your business and customer data. Transparent privacy practices for our WhatsApp ordering platform.',
  keywords: 'waveorder privacy policy, data protection, privacy practices, gdpr compliance',
  alternates: {
    canonical: 'https://waveorder.app/privacy',
  },
  openGraph: {
    title: 'WaveOrder Privacy Policy - Data Protection and Privacy',
    description: 'Transparent privacy practices for WaveOrder WhatsApp ordering platform.',
    type: 'website',
    url: 'https://waveorder.app/privacy',
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function PrivacyPage() {
  return <Privacy />
}