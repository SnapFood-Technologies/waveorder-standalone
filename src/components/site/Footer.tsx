// src/components/site/Footer.tsx
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-1 mb-4">
              <Image
                src="/images/waveorderlogo.png"
                alt="WaveOrder Logo"
                width={50}
                height={50}
                quality={100}
                unoptimized
                placeholder="empty"
                className="w-[50px] h-[50px]"
              />
              <span className="text-xl font-bold">WaveOrder</span>
            </Link>
            <p className="text-gray-400 leading-relaxed max-w-xs">
              The simplest way to sell on WhatsApp. Create catalogs, receive orders, grow your business — without complexity.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors">
                <span>📷</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors">
                <span>🐦</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors">
                <span>💼</span>
              </a>
            </div>
          </div>
          
          {/* Product Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/demo" className="text-gray-400 hover:text-white transition-colors">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="/developers" className="text-gray-400 hover:text-white transition-colors">
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-gray-400 hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Industries Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Industries</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/instagram-sellers" className="text-gray-400 hover:text-white transition-colors">
                  Instagram Sellers
                </Link>
              </li>
              <li>
                <Link href="/restaurants" className="text-gray-400 hover:text-white transition-colors">
                  Restaurants
                </Link>
              </li>
              <li>
                <Link href="/retail" className="text-gray-400 hover:text-white transition-colors">
                  Retail Stores
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 Electral Shpk. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Made with ❤️ for businesses worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
