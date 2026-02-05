// src/components/site/Header.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, LayoutDashboard, ChevronDown } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [industriesOpen, setIndustriesOpen] = useState(false)
  const [useCasesOpen, setUseCasesOpen] = useState(false)
  const [mobileIndustriesOpen, setMobileIndustriesOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)
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
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/images/waveorderlogo.png"
              alt="WaveOrder Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg"
            />
            <span className="text-xl font-bold text-gray-900">WaveOrder</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {/* Industries Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIndustriesOpen(true)}
              onMouseLeave={() => setIndustriesOpen(false)}
            >
              <button className="flex items-center space-x-1 text-gray-600 hover:text-teal-600 font-medium transition-colors py-2">
                <span>Industries</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {industriesOpen && (
                <div className="absolute top-full left-0 pt-1 w-56 z-50">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                    <Link href="/restaurants" className="block px-4 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                      Restaurants & Cafes
                    </Link>
                    <Link href="/retail" className="block px-4 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                      Retail & E-commerce
                    </Link>
                    <Link href="/instagram-sellers" className="block px-4 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                      Instagram Sellers
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Use Cases Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setUseCasesOpen(true)}
              onMouseLeave={() => setUseCasesOpen(false)}
            >
              <button className="flex items-center space-x-1 text-gray-600 hover:text-teal-600 font-medium transition-colors py-2">
                <span>Use Cases</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {useCasesOpen && (
                <div className="absolute top-full left-0 pt-1 w-56 z-50">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                    <Link href="/instagram-sellers" className="block px-4 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                      Instagram Sellers
                    </Link>
                    <Link href="/features" className="block px-4 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                      WhatsApp Business
                    </Link>
                    <Link href="/features" className="block px-4 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                      Link-in-Bio Stores
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/features" className="text-gray-600 hover:text-teal-600 font-medium transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-teal-600 font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/demo" className="text-gray-600 hover:text-teal-600 font-medium transition-colors">
              Demo
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <button
                onClick={handleDashboardClick}
                className="bg-teal-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-teal-700 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center space-x-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-600 hover:text-teal-600 font-medium transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-teal-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-teal-700 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-900"
            onClick={() => {
              setIsMenuOpen(!isMenuOpen)
              if (!isMenuOpen) setMobileIndustriesOpen(false) // Reset submenu when opening
            }}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-2">
              {/* Industries Section - Collapsible */}
              <div>
                <button
                  onClick={() => setMobileIndustriesOpen(!mobileIndustriesOpen)}
                  className="flex items-center justify-between w-full py-2 text-gray-700 font-medium"
                >
                  <span>Industries</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileIndustriesOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileIndustriesOpen && (
                  <div className="pl-4 space-y-2 pb-2">
                    <Link href="/restaurants" onClick={closeMenu} className="block text-gray-600 hover:text-teal-600 py-1">
                      Restaurants & Cafes
                    </Link>
                    <Link href="/retail" onClick={closeMenu} className="block text-gray-600 hover:text-teal-600 py-1">
                      Retail & E-commerce
                    </Link>
                    <Link href="/instagram-sellers" onClick={closeMenu} className="block text-gray-600 hover:text-teal-600 py-1">
                      Instagram Sellers
                    </Link>
                  </div>
                )}
              </div>
              
              <Link href="/features" onClick={closeMenu} className="block text-gray-700 hover:text-teal-600 font-medium py-2">
                Features
              </Link>
              <Link href="/pricing" onClick={closeMenu} className="block text-gray-700 hover:text-teal-600 font-medium py-2">
                Pricing
              </Link>
              <Link href="/demo" onClick={closeMenu} className="block text-gray-700 hover:text-teal-600 font-medium py-2">
                Demo
              </Link>
              
              <div className="pt-4 border-t border-gray-100 space-y-3">
                {session ? (
                  <button
                    onClick={() => { closeMenu(); handleDashboardClick(); }}
                    className="block w-full bg-teal-600 text-white px-6 py-2.5 rounded-full font-semibold text-center hover:bg-teal-700 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </div>
                  </button>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={closeMenu} className="block text-gray-700 hover:text-teal-600 font-medium py-2">
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={closeMenu}
                      className="block bg-teal-600 text-white px-6 py-2.5 rounded-full font-semibold text-center hover:bg-teal-700 transition-colors"
                    >
                      Start Free Trial
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