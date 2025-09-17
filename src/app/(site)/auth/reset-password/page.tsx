// app/site/auth/reset-password/page.tsx
import type { Metadata } from 'next'
import ResetPasswordComponent from '@/components/auth/ResetPassword'

export const metadata: Metadata = {
  title: 'Reset Password - WaveOrder | Create New Password',
  description: 'Create a new password for your WaveOrder account using the reset link sent to your email.',
  robots: {
    index: false,
    follow: false,
  }
}

export default function ResetPassword() {
  return <ResetPasswordComponent />
}