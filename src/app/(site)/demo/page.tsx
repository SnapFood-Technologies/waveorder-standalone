// src/app/site/demo/page.tsx
import Demo from '@/components/site/Demo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Demo - See WaveOrder WhatsApp Ordering in Action',
  description: 'Experience WaveOrder with live interactive demos. See how restaurants create catalogs, manage orders, and receive WhatsApp orders from customers.',
  keywords: 'waveorder demo, whatsapp ordering demo, restaurant catalog demo, live preview, interactive demo',
  alternates: {
    canonical: 'https://waveorder.app/demo',
  },
  openGraph: {
    title: 'WaveOrder Live Demo - WhatsApp Ordering Platform',
    description: 'Try WaveOrder with interactive demos showcasing restaurant catalogs, order management, and WhatsApp integration.',
    type: 'website',
    url: 'https://waveorder.app/demo',
    images: [{
      url: 'https://waveorder.app/images/demo-og.png',
      width: 1200,
      height: 630,
      alt: 'WaveOrder Demo Preview',
    }],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function DemoPage() {
  return (
    <>
      {/* Demo Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "WaveOrder Demo",
            "description": "Interactive demo of WaveOrder WhatsApp ordering platform",
            "url": "https://waveorder.app/demo",
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "WaveOrder",
              "applicationCategory": "Business Application",
              "demo": "https://waveorder.app/demo",
              "description": "Live demonstration of WhatsApp ordering platform features"
            }
          })
        }}
      />

      <Demo />
    </>
  )
}