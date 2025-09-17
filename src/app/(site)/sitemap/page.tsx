// src/app/site/sitemap/page.tsx
import Sitemap from '@/components/site/Sitemap'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sitemap - WaveOrder Website Structure and Navigation',
  description: 'Complete sitemap of WaveOrder website including all pages for WhatsApp ordering platform features, pricing, support, and resources.',
  keywords: 'waveorder sitemap, website navigation, site structure, all pages',
  alternates: {
    canonical: 'https://waveorder.app/sitemap',
  },
  openGraph: {
    title: 'WaveOrder Sitemap - Complete Website Navigation',
    description: 'Browse the complete structure of WaveOrder website and find all pages related to WhatsApp ordering platform.',
    type: 'website',
    url: 'https://waveorder.app/sitemap',
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function SitemapPage() {
  return (
    <>
      {/* Sitemap Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "WaveOrder Sitemap",
            "description": "Complete navigation structure of WaveOrder WhatsApp ordering platform website",
            "url": "https://waveorder.app/sitemap"
          })
        }}
      />

      <Sitemap />
    </>
  )
}