// src/app/site/features/page.tsx
import Features from '@/components/site/Features'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features - WhatsApp Ordering Platform for Restaurants | WaveOrder',
  description: 'Discover all WaveOrder features: direct WhatsApp orders, mobile catalogs, team collaboration, inventory management, analytics, and more. No API fees required.',
  keywords: 'whatsapp ordering features, restaurant ordering system, mobile catalog, inventory management, team collaboration, order analytics, whatsapp business',
  alternates: {
    canonical: 'https://waveorder.app/features',
  },
  openGraph: {
    title: 'WaveOrder Features - Complete WhatsApp Ordering Solution',
    description: 'Everything you need to manage WhatsApp orders: beautiful catalogs, team collaboration, analytics, and seamless customer experience.',
    type: 'website',
    url: 'https://waveorder.app/features',
    images: [{
      url: 'https://waveorder.app/images/features-og.png',
      width: 1200,
      height: 630,
      alt: 'WaveOrder Features Overview',
    }],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function FeaturesPage() {
  return (
    <>
      {/* Features Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "WaveOrder Features",
            "description": "Complete WhatsApp ordering platform features for restaurants and businesses",
            "url": "https://waveorder.app/features",
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "WaveOrder",
              "applicationCategory": "Business Application",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Direct WhatsApp Integration",
                "Mobile-Optimized Catalogs",
                "Team Collaboration",
                "Inventory Management",
                "Order Analytics",
                "Custom Branding",
                "Multi-language Support",
                "Payment Flexibility"
              ]
            }
          })
        }}
      />

      <Features />
    </>
  )
}