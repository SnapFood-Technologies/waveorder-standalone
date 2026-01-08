// src/app/page.tsx
import Home from '@/components/site/Home'
import type { Metadata } from 'next'
import { NextRequest, NextResponse } from 'next/server'

// Handle POST requests (likely bots/scanners) to prevent JSON parse errors
export async function POST(request: NextRequest) {
  try {
    // Try to parse the body to catch invalid JSON early
    const body = await request.json().catch(() => null)
    
    // Return 405 Method Not Allowed for POST requests to homepage
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  } catch (error) {
    // If JSON parsing fails, return 400 Bad Request
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}

export const metadata: Metadata = {
  title: 'WaveOrder - Make WhatsApp Ordering Super Easy | Restaurant Ordering Platform',
  description: 'Create beautiful catalogs and receive orders directly on WhatsApp. Perfect for restaurants, cafes, and retail businesses. No expensive WhatsApp Business API required.',
  keywords: 'whatsapp ordering, restaurant ordering, whatsapp business, food ordering, catalog ordering, whatsapp menu, restaurant technology',
  alternates: {
    canonical: 'https://waveorder.app',
  },
  openGraph: {
    title: 'WaveOrder - Make WhatsApp Ordering Super Easy',
    description: 'Restaurant-first WhatsApp ordering platform. Create catalogs, receive orders, manage everything.',
    type: 'website',
    url: 'https://waveorder.app',
    images: [{
      url: 'https://waveorder.app/images/og-image.png',
      width: 1200,
      height: 630,
      alt: 'WaveOrder - WhatsApp Ordering Platform',
    }],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function HomePage() {
  return (
    <>
      {/* FAQ Schema for restaurant owners */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Do I need WhatsApp Business API?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No! WaveOrder works with your regular WhatsApp or WhatsApp Business number. No expensive API required - orders come directly to your existing WhatsApp."
                }
              },
              {
                "@type": "Question",
                "name": "How do customers place orders?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Customers browse your catalog, select items, and click 'Order via WhatsApp' which opens WhatsApp with a pre-formatted order message ready to send."
                }
              },
              {
                "@type": "Question",
                "name": "Can my team help manage orders?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! WaveOrder supports multiple team members with different roles. Perfect for restaurants with staff managing orders and inventory."
                }
              },
              {
                "@type": "Question",
                "name": "How do I add my menu items?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You can add products manually, upload via CSV file, or integrate through our API. We support variants, modifiers, and inventory tracking."
                }
              }
            ]
          })
        }}
      />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "WaveOrder",
            "description": "WhatsApp ordering platform for restaurants and businesses. Create beautiful catalogs and receive orders directly on WhatsApp.",
            "url": "https://waveorder.app",
            "logo": "https://waveorder.app/images/waveorder-logo.png",
            "foundingDate": "2025",
            "slogan": "Make WhatsApp Ordering Super Easy",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "support@waveorder.app"
            }
          })
        }}
      />

      {/* Website Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "WaveOrder",
            "url": "https://waveorder.app",
            "description": "Make WhatsApp ordering super easy for restaurants and businesses",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://waveorder.app/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />

      <Home />
    </>
  )
}