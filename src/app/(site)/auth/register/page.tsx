// app/auth/register/page.tsx
import type { Metadata } from 'next'
import RegisterComponent from '@/components/auth/Register'

export const metadata: Metadata = {
  title: 'Sign Up - WaveOrder | Create Your Account',
  description: 'Create your free WaveOrder account and start building your WhatsApp ordering system for your restaurant.',
  robots: {
    index: true,
    follow: true,
  }
}

export default function Register() {
  return <RegisterComponent />
}