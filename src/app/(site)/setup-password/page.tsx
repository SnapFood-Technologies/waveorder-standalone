// app/(site)/setup-password/page.tsx
import type { Metadata } from 'next'
import SetupPasswordComponent from '@/components/auth/SetupPassword'

export const metadata: Metadata = {
  title: 'Complete Setup - WaveOrder | Create Your Password',
  description: 'Complete your WaveOrder account setup by creating your password.',
  robots: {
    index: false,
    follow: false,
  }
}

export default function SetupPassword() {
  return <SetupPasswordComponent />
}