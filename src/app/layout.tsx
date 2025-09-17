// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import SessionProvider from '@/components/SessionProvider'
import GoogleAnalytics from '@/components/site/GoogleAnalytics'
import MicrosoftClarity from '@/components/site/MicrosoftClarity'

export const metadata: Metadata = {
  title: 'WaveOrder - WhatsApp Ordering Made Easy',
  description: 'Create beautiful catalogs and receive orders directly on WhatsApp',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        <MicrosoftClarity />
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}