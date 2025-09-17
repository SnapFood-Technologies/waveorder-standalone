// src/app/site/resources/page.tsx
import Resources from '@/components/site/Resources'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resources - Help Center and FAQs | WaveOrder',
  description: 'Find answers to common questions about WaveOrder WhatsApp ordering platform. Browse FAQs, guides, and best practices for restaurant ordering systems.',
  keywords: 'waveorder help, whatsapp ordering faq, restaurant ordering help, setup guides, best practices',
  alternates: {
    canonical: 'https://waveorder.app/resources',
  },
  openGraph: {
    title: 'WaveOrder Resources - Help Center and FAQs',
    description: 'Get help with WaveOrder WhatsApp ordering platform. Find answers, guides, and support resources.',
    type: 'website',
    url: 'https://waveorder.app/resources',
    images: [{
      url: 'https://waveorder.app/images/resources-og.png',
      width: 1200,
      height: 630,
      alt: 'WaveOrder Resources',
    }],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function ResourcesPage() {
  return (
    <>
      {/* Resources Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "WaveOrder Resources",
            "description": "Help center and resources for WaveOrder WhatsApp ordering platform",
            "url": "https://waveorder.app/resources",
            "mainEntity": {
              "@type": "FAQPage",
              "name": "WaveOrder FAQ",
              "description": "Frequently asked questions about WhatsApp ordering platform"
            }
          })
        }}
      />

      <Resources />
    </>
  )
}