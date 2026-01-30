// src/components/site/Header.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, Waves, LayoutDashboard } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const handleDashboardClick = async () => {
    try {
      const response = await fetch('/api/user/businesses')
      if (response.ok) {
        const data = await response.json()
        if (data.businesses && data.businesses.length > 0) {
          router.push(`/admin/stores/${data.businesses[0].id}/dashboard`)
        } else {
          router.push('/setup')
        }
      }
    } catch (error) {
      console.error('Error fetching businesses:', error)
      router.push('/admin/dashboard')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">WaveOrder</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-gray-700 hover:text-teal-600 font-medium">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-teal-600 font-medium">
              Pricing
            </Link>
            <Link href="/demo" className="text-gray-700 hover:text-teal-600 font-medium">
              Demo
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-teal-600 font-medium">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-teal-600 font-medium">
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <button
                onClick={handleDashboardClick}
                className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center space-x-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-teal-600 font-medium">
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link href="/features" className="text-gray-700 hover:text-teal-600 font-medium">
                Features
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-teal-600 font-medium">
                Pricing
              </Link>
              <Link href="/demo" className="text-gray-700 hover:text-teal-600 font-medium">
                Demo
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-teal-600 font-medium">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-teal-600 font-medium">
                Contact
              </Link>
              <div className="pt-4 border-t border-gray-200">
                {session ? (
                  <button
                    onClick={handleDashboardClick}
                    className="block w-full bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold text-center hover:bg-teal-700 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </div>
                  </button>
                ) : (
                  <>
                    <Link href="/auth/login" className="block text-gray-700 hover:text-teal-600 font-medium mb-2">
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold text-center hover:bg-teal-700 transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}