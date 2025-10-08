// src/app/site/not-found.tsx
import NotFoundClient from '@/components/site/NotFoundClient'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found | WaveOrder',
  description: 'The page you are looking for could not be found.',
  robots: {
    index: false,
    follow: false,
  }
}

export default function NotFound() {
  return (
    <>
      <Header />
      <main>
        <NotFoundClient />
      </main>
      <Footer />
    </>
  )
}