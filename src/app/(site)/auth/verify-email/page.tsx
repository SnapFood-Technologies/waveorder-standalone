// app/auth/verify-email/page.tsx
import type { Metadata } from 'next'
import VerifyEmailComponent from '@/components/auth/VerifyEmail'

export const metadata: Metadata = {
  title: 'Verify Email - WaveOrder | Complete Your Registration',
  description: 'Verify your email address to complete your WaveOrder account setup and access all features.',
  robots: {
    index: false,
    follow: false,
  }
}

export default function VerifyEmail() {
  return <VerifyEmailComponent />
}