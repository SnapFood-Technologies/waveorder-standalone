// app/auth/login/page.tsx
import type { Metadata } from 'next'
import LoginComponent from '@/components/auth/Login'

export const metadata: Metadata = {
  title: 'Sign In - WaveOrder | Access Your Account',
  description: 'Sign in to your WaveOrder account to manage your WhatsApp ordering system and view analytics.',
  robots: {
    index: true,
    follow: true,
  }
}

export default function Login() {
  return <LoginComponent />
}