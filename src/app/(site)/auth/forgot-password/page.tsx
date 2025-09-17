// app/auth/forgot-password/page.tsx
import type { Metadata } from 'next'
import ForgotPasswordComponent from '@/components/auth/ForgotPassword'

export const metadata: Metadata = {
  title: 'Forgot Password - WaveOrder | Reset Your Password',
  description: 'Reset your WaveOrder account password. Enter your email to receive a password reset link.',
  robots: {
    index: false,
    follow: false,
  }
}

export default function ForgotPassword() {
  return <ForgotPasswordComponent />
}
