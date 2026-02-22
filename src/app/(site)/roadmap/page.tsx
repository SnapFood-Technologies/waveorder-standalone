import PublicRoadmap from '@/components/site/PublicRoadmap'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Roadmap - WaveOrder Product Roadmap',
  description: 'See what we\'re building next at WaveOrder. Upvote features, leave feedback, and follow our progress on the WhatsApp ordering platform.',
  keywords: 'waveorder roadmap, product roadmap, upcoming features, feature requests',
  alternates: {
    canonical: 'https://waveorder.app/roadmap',
  },
  openGraph: {
    title: 'WaveOrder Product Roadmap',
    description: 'See what we\'re building next. Upvote features and share your feedback.',
    type: 'website',
    url: 'https://waveorder.app/roadmap',
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function RoadmapPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "WaveOrder Product Roadmap",
            "description": "See what we're building next at WaveOrder. Upvote features and share your feedback.",
            "url": "https://waveorder.app/roadmap"
          })
        }}
      />
      <PublicRoadmap />
    </>
  )
}
