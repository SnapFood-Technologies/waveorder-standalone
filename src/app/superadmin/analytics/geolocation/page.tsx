'use client'

import { Globe, MapPin, Construction } from 'lucide-react'

export default function GeolocationPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Globe className="w-7 h-7 text-blue-600" />
          Geolocation Analytics
        </h1>
        <p className="text-gray-600 mt-1">Geographic distribution and location-based insights</p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Construction className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600 max-w-md">
            Geolocation analytics will provide insights into where your businesses and customers are located, 
            helping you understand geographic trends and opportunities.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Business Locations</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Globe className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Country Distribution</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Customer Heat Maps</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
