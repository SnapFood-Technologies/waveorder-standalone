// src/components/site/Footer.tsx
import Link from 'next/link'
import { Waves, MapPin, Phone, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Company Info - spans 2 cols on mobile, 2 cols on desktop */}
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">WaveOrder</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              WhatsApp ordering platform built specifically for restaurants and food businesses. 
              Create catalogs, receive orders, manage operations efficiently.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <Mail className="w-4 h-4 mr-3 text-teal-400" />
                <span>hello@waveorder.app</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone className="w-4 h-4 mr-3 text-teal-400" />
                <span>+1 (555) 123-WAVE</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin className="w-4 h-4 mr-3 text-teal-400" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold mb-6 text-lg">Platform</h4>
            <ul className="space-y-3 text-gray-300">
              <li><Link href="/features" className="hover:text-teal-400 transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-teal-400 transition-colors">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-teal-400 transition-colors">Demo</Link></li>
              <li><Link href="/auth/register" className="hover:text-teal-400 transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-6 text-lg">Company</h4>
            <ul className="space-y-3 text-gray-300">
              <li><Link href="/about" className="hover:text-teal-400 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-teal-400 transition-colors">Contact</Link></li>
              <li><Link href="/sitemap" className="hover:text-teal-400 transition-colors">Sitemap</Link></li>
              <li><Link href="/resources" className="hover:text-teal-400 transition-colors">Resources</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 WaveOrder Inc. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">
                Terms
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-teal-400 text-sm transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}