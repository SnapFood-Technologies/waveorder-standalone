'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Waves, User, LayoutDashboard } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // TODO: Replace with actual session check
  const isLoggedIn = false

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/site" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-2 rounded-lg">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">WaveOrder</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/site" 
              className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/site/about" 
              className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
            >
              About
            </Link>
            <Link 
              href="/site/pricing" 
              className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/demo" 
              className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
            >
              Demo
            </Link>
            <Link 
              href="/site/contact" 
              className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Auth & CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-teal-600 font-medium transition-colors flex items-center"
                >
                  <User className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                <div className="h-4 w-px bg-gray-300"></div>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-teal-600 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            <Link
              href="/site"
              className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/site/about"
              className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/site/pricing"
              className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/demo"
              className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Demo
            </Link>
            <Link
              href="/site/contact"
              className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="border-t border-gray-200 pt-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="block mx-3 mt-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all text-center flex items-center justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-md transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block mx-3 mt-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Start Free Trial
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}