// src/app/page.tsx
import Home from '@/components/site/Home'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WaveOrder - Sell on WhatsApp Without the Complexity | Online Catalog & Ordering',
  description: 'Create a beautiful product catalog, share the link anywhere, and receive orders directly on WhatsApp. Perfect for Instagram sellers, restaurants, retail stores, and any business. No WhatsApp API required.',
  keywords: 'whatsapp ordering, instagram seller, link in bio store, whatsapp business, product catalog, online store, restaurant ordering, retail ordering, whatsapp shop',
  alternates: {
    canonical: 'https://waveorder.app',
  },
  openGraph: {
    title: 'WaveOrder - Sell on WhatsApp Without the Complexity',
    description: 'The simplest way to sell on WhatsApp. Create catalogs, receive orders, grow your business — perfect for Instagram sellers, restaurants, and retail stores.',
    type: 'website',
    url: 'https://waveorder.app',
    images: [{
      url: 'https://waveorder.app/images/og-image.png',
      width: 1200,
      height: 630,
      alt: 'WaveOrder - WhatsApp Ordering Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WaveOrder - Sell on WhatsApp Without the Complexity',
    description: 'Create a beautiful product catalog, share the link anywhere, and receive orders directly on WhatsApp.',
    images: ['https://waveorder.app/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function HomePage() {
  return (
    <>
      {/* FAQ Schema */}
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
                  "text": "No! WaveOrder works with your regular WhatsApp or WhatsApp Business app. Orders come directly to your existing number without any API setup, verification, or per-message fees."
                }
              },
              {
                "@type": "Question",
                "name": "How do customers place orders?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Customers browse your online catalog, select items, and click 'Order via WhatsApp'. This opens WhatsApp with a pre-formatted order message ready to send to you. Simple and familiar for everyone."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use this with my Instagram bio link?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely! WaveOrder is perfect as a link-in-bio store. Share your catalog link in your Instagram bio, stories, or posts. Followers can browse your products and order directly through WhatsApp."
                }
              },
              {
                "@type": "Question",
                "name": "What payment methods are supported?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You can accept cash on delivery, bank transfers, or integrate with payment gateways like Stripe and PayPal. You handle payments directly with your customers — we don't take any cut."
                }
              },
              {
                "@type": "Question",
                "name": "How quickly can I get started?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Most businesses have their catalog live within 5 minutes. Just sign up, add your products (manually or via CSV import), connect your WhatsApp number, and share your link."
                }
              },
              {
                "@type": "Question",
                "name": "Can I manage multiple stores?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Pro and Business plans support multiple catalogs. Create separate catalogs for different locations, brands, or product lines — each with its own link and settings."
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
            "description": "The simplest way to sell on WhatsApp. Create catalogs, receive orders, grow your business — without complexity.",
            "url": "https://waveorder.app",
            "logo": "https://waveorder.app/images/waveorder-logo.png",
            "foundingDate": "2025",
            "slogan": "Sell on WhatsApp Without the Complexity",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "support@waveorder.app"
            }
          })
        }}
      />

      {/* Software Application Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "WaveOrder",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "19",
              "priceCurrency": "USD",
              "priceValidUntil": "2026-12-31"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "150"
            }
          })
        }}
      />

      <Home />
    </>
  )
}
