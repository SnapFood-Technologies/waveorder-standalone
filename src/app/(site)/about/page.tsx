// src/app/site/about/page.tsx
import About from '@/components/site/About'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About WaveOrder - WhatsApp Ordering Platform for Restaurants',
  description: 'Learn about WaveOrder mission to make WhatsApp ordering simple for restaurants and businesses. Discover our story, values, and commitment to helping businesses grow.',
  keywords: 'about waveorder, company mission, whatsapp ordering platform, restaurant technology, business growth',
  alternates: {
    canonical: 'https://waveorder.app/about',
  },
  openGraph: {
    title: 'About WaveOrder - Making WhatsApp Ordering Super Easy',
    description: 'Our mission is to help restaurants and businesses leverage WhatsApp for seamless ordering experiences.',
    type: 'website',
    url: 'https://waveorder.app/about',
    images: [{
      url: 'https://waveorder.app/images/about-og.png',
      width: 1200,
      height: 630,
      alt: 'About WaveOrder',
    }],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function AboutPage() {
  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "About WaveOrder",
            "description": "Learn about WaveOrder's mission to simplify WhatsApp ordering for restaurants and businesses",
            "url": "https://waveorder.app/about",
            "mainEntity": {
              "@type": "Organization",
              "name": "WaveOrder",
              "foundingDate": "2025",
              "description": "WhatsApp ordering platform for restaurants and businesses",
              "mission": "To make WhatsApp ordering super easy for businesses worldwide",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "hello@waveorder.app"
              }
            }
          })
        }}
      />

      <About />
    </>
  )
}