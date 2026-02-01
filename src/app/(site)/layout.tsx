'use client'

import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'

const inter = Inter({ subsets: ['latin'] })

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // All known app routes - everything else is a business slug
  const appRoutes = [
    '/',
    '/features',
    '/pricing', 
    '/demo',
    '/about', 
    '/contact',
    '/sitemap',
    '/resources',
    '/auth/register',
    '/auth/verify-email-change',
    '/auth/login',
    '/dashboard',
    '/documentation',
    '/api-docs',
    '/api-reference',
    '/privacy',
    '/terms',
    '/cookies',
    '/api',
    '/admin',
    // Industry landing pages
    '/instagram-sellers',
    '/restaurants',
    '/retail'
  ]
  
  const isBusinessSlug = !appRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  ) && pathname.split('/').length === 2
  
  return (
    <div className={inter.className}>
      {!isBusinessSlug && <Header />}
      <main>
        {children}
      </main>
      {!isBusinessSlug && <Footer />}
    </div>
  )
}