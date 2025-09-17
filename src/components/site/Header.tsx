import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/site" className="text-2xl font-bold text-blue-600">
            WaveOrder
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link href="/site" className="text-gray-700 hover:text-blue-600">Home</Link>
            <Link href="/site/about" className="text-gray-700 hover:text-blue-600">About</Link>
            <Link href="/site/pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
            <Link href="/site/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
          </nav>
          <div className="flex space-x-4">
            <Link href="/login" className="text-blue-600 hover:text-blue-800">Login</Link>
            <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
