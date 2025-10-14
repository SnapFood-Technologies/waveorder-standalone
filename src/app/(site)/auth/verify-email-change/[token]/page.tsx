// src/app/auth/verify-email-change/[token]/page.tsx
import type { Metadata } from 'next'
import VerifyEmailChange from '@/components/auth/VerifyEmailChange'

export const metadata: Metadata = {
  title: 'Verify Email Change - WaveOrder',
  description: 'Verify your new email address to complete the change.',
  robots: {
    index: false,
    follow: false,
  }
}

export default async function VerifyEmailChangePage({ 
  params 
}: { 
  params: Promise<{ token: string }> 
}) {
  const { token } = await params
  return <VerifyEmailChange token={token} />
}