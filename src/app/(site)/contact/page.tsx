// src/app/site/contact/page.tsx
import Contact from '@/components/site/Contact'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact WaveOrder Support - Get Help with WhatsApp Ordering',
  description: 'Get in touch with WaveOrder support team. Ask questions, schedule demos, or get help setting up your WhatsApp ordering system.',
  keywords: 'contact waveorder, customer support, whatsapp ordering help, schedule demo, technical support',
  alternates: {
    canonical: 'https://waveorder.app/contact',
  },
  openGraph: {
    title: 'Contact WaveOrder - We are Here to Help',
    description: 'Need help with WhatsApp ordering? Our support team is ready to assist you with setup, questions, and demos.',
    type: 'website',
    url: 'https://waveorder.app/contact',
    images: [{
      url: 'https://waveorder.app/images/contact-og.png',
      width: 1200,
      height: 630,
      alt: 'Contact WaveOrder Support',
    }],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function ContactPage() {
  return (
    <>
      {/* Contact Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact WaveOrder",
            "description": "Get in touch with WaveOrder support for help with WhatsApp ordering platform",
            "url": "https://waveorder.app/contact",
            "mainEntity": {
              "@type": "Organization",
              "name": "WaveOrder",
              "contactPoint": [
                {
                  "@type": "ContactPoint",
                  "contactType": "customer service",
                  "email": "contact@waveorder.app",
                  "availableLanguage": ["English"],
                  "areaServed": "Worldwide"
                },
                {
                  "@type": "ContactPoint", 
                  "contactType": "technical support",
                  "email": "support@waveorder.app",
                  "availableLanguage": ["English"],
                  "areaServed": "Worldwide"
                }
              ]
            }
          })
        }}
      />

      <Contact />
    </>
  )
}