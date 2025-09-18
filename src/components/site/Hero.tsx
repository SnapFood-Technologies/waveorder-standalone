import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Make Ordering on <span className="text-blue-600">WhatsApp</span> Super Easy
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your customers will love this. No confusion. Create beautiful catalogs and receive orders directly on WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start for Free
            </Link>
            <Link 
              href="/demo" 
              className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              View Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
