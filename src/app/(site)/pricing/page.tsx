// src/app/site/pricing/page.tsx
import Pricing from '@/components/site/PricingComponent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - WaveOrder WhatsApp Ordering Platform | Simple & Transparent',
  description: 'Choose the perfect WaveOrder plan for your business. Starter plan at $6/month or upgrade to Pro for advanced features. No setup fees, no transaction fees, cancel anytime.',
  keywords: 'waveorder pricing, whatsapp ordering cost, restaurant ordering platform price, free whatsapp ordering, pro business plan',
  alternates: {
    canonical: 'https://waveorder.app/pricing',
  },
  openGraph: {
    title: 'WaveOrder Pricing - Simple & Transparent Plans',
    description: 'Starter plan at $6/month or upgrade to Pro for advanced WhatsApp ordering features. No hidden fees, no setup costs.',
    type: 'website',
    url: 'https://waveorder.app/pricing',
    images: [{
      url: 'https://waveorder.app/images/pricing-og.png',
      width: 1200,
      height: 630,
      alt: 'WaveOrder Pricing Plans',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WaveOrder Pricing - Starter & Pro Plans',
    description: 'Simple, transparent pricing for WhatsApp ordering. Starter plan at $6/month.',
    images: ['https://waveorder.app/images/pricing-twitter.png'],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function PricingPage() {
  return (
    <>
      {/* Product Schema for Starter Plan */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "WaveOrder Starter Plan",
            "description": "WhatsApp ordering platform for small businesses. Up to 30 products, basic branding, and mobile catalog.",
            "brand": {
              "@type": "Brand",
              "name": "WaveOrder"
            },
            "offers": [
              {
                "@type": "Offer",
                "name": "Monthly Billing",
                "price": "6",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "validFrom": "2025-09-01",
                "priceValidUntil": "2026-12-31",
                "eligibleQuantity": {
                  "@type": "QuantitativeValue",
                  "unitText": "MON"
                }
              },
              {
                "@type": "Offer",
                "name": "Annual Billing",
                "price": "5",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "validFrom": "2025-09-01",
                "priceValidUntil": "2026-12-31",
                "eligibleQuantity": {
                  "@type": "QuantitativeValue",
                  "unitText": "MON"
                }
              }
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "reviewCount": "2"
            }
          })
        }}
      />

      {/* Product Schema for Pro Plan */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "WaveOrder Pro Plan",
            "description": "Advanced WhatsApp ordering platform for growing businesses. Unlimited products, custom branding, analytics, and priority support.",
            "brand": {
              "@type": "Brand",
              "name": "WaveOrder"
            },
            "offers": [
              {
                "@type": "Offer",
                "name": "Monthly Billing",
                "price": "19",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "validFrom": "2025-09-01",
                "priceValidUntil": "2026-12-31",
                "eligibleQuantity": {
                  "@type": "QuantitativeValue",
                  "unitText": "MON"
                }
              },
              {
                "@type": "Offer",
                "name": "Annual Billing",
                "price": "15",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "validFrom": "2025-09-01",
                "priceValidUntil": "2026-12-31",
                "eligibleQuantity": {
                  "@type": "QuantitativeValue",
                  "unitText": "MON"
                }
              }
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "reviewCount": "2"
            }
          })
        }}
      />

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
                "name": "What's included in the Starter plan?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our Starter plan ($6/month) includes core WhatsApp ordering features for up to 30 products, 10 categories, basic branding, CSV import, and basic order analytics. It's perfect for small businesses getting started."
                }
              },
              {
                "@type": "Question",
                "name": "Can I upgrade or downgrade anytime?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely! You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at your next billing cycle."
                }
              },
              {
                "@type": "Question",
                "name": "Do you charge transaction fees?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No, we never charge transaction fees or commissions on your orders. You keep 100% of your revenue."
                }
              },
              {
                "@type": "Question",
                "name": "What payment methods do you accept?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through Stripe."
                }
              }
            ]
          })
        }}
      />

      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "WaveOrder WhatsApp Ordering Platform",
            "description": "Complete WhatsApp ordering solution for restaurants and businesses. Create beautiful catalogs and receive orders directly through WhatsApp.",
            "provider": {
              "@type": "Organization",
              "name": "WaveOrder",
              "url": "https://waveorder.app"
            },
            "areaServed": "Worldwide",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "WaveOrder Pricing Plans",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Starter Plan"
                  },
                  "price": "6",
                  "priceCurrency": "USD"
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Pro Plan"
                  },
                  "price": "19",
                  "priceCurrency": "USD"
                }
              ]
            }
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
            "url": "https://waveorder.app",
            "description": "WhatsApp ordering platform for restaurants and businesses",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "hello@waveorder.app",
              "availableLanguage": "English"
            },
            "sameAs": [
              "https://twitter.com/waveorder",
              "https://linkedin.com/company/waveorder"
            ]
          })
        }}
      />

      <Pricing />
    </>
  )
}