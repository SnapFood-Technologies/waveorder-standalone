// app/site/auth/register/page.tsx
import type { Metadata } from 'next'
import RegisterComponent from '@/components/auth/Register'

export const metadata: Metadata = {
  title: 'Sign Up - WaveOrder | Create Your Account',
  description: 'Create your WaveOrder account and start building your WhatsApp ordering system for your restaurant. Starter plan at $6/month.',
  robots: {
    index: true,
    follow: true,
  }
}

export default function Register() {
  return <RegisterComponent />
}