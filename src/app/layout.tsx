import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WaveOrder - WhatsApp Ordering Made Easy',
  description: 'Create beautiful catalogs and receive orders directly on WhatsApp',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
