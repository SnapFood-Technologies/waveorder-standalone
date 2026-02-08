// src/app/(site)/developers/page.tsx
/**
 * Public API Documentation page
 * Provides comprehensive documentation for the WaveOrder REST API
 * Note: API Access requires Business plan subscription
 */
import { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Key,
  Lock,
  Code,
  BookOpen,
  Zap,
  Shield,
  AlertCircle,
  ChevronRight,
  Terminal,
  Package,
  ShoppingCart,
  FolderOpen,
  User,
  ExternalLink
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'API Documentation | WaveOrder',
  description: 'Integrate WaveOrder with your applications using our REST API. Access products, orders, and categories programmatically.',
  robots: { index: true, follow: true }
}

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-6">
            <Code className="h-4 w-4" />
            REST API v1
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            WaveOrder API
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build powerful integrations with your POS, mobile apps, and third-party services using our comprehensive REST API.
          </p>
          
          {/* Business Plan Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium mb-8">
            <Shield className="h-4 w-4" />
            Requires Business Plan Subscription
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Get Business Plan
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="#quickstart"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Read Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">RESTful Design</h3>
              <p className="text-gray-600">
                Clean, predictable URLs and standard HTTP methods. Easy to understand and integrate.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure</h3>
              <p className="text-gray-600">
                API key authentication with granular scopes. All requests over HTTPS.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rate Limited</h3>
              <p className="text-gray-600">
                60 requests per minute per key. Fair usage ensures reliability for all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section id="quickstart" className="py-16 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-5 w-5 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">Quick Start</h2>
          </div>
          <p className="text-gray-600 mb-8">
            Get started in minutes with our simple REST API.
          </p>

          {/* Step 1 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center">1</span>
              <h3 className="font-semibold text-gray-900">Generate an API Key</h3>
            </div>
            <p className="text-gray-600 ml-8 mb-4">
              Go to your admin dashboard → API Access → Create Key
            </p>
          </div>

          {/* Step 2 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center">2</span>
              <h3 className="font-semibold text-gray-900">Make Your First Request</h3>
            </div>
            <div className="ml-8 bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-100">
{`curl -X GET "https://waveorder.app/api/v1/products" \\
  -H "Authorization: Bearer wo_live_YOUR_API_KEY"`}
              </pre>
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center">3</span>
              <h3 className="font-semibold text-gray-900">Get JSON Response</h3>
            </div>
            <div className="ml-8 bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-100">
{`{
  "products": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Margherita Pizza",
      "price": 12.99,
      "stock": 50,
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "pages": 3
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">Authentication</h2>
          </div>
          <p className="text-gray-600 mb-6">
            All API requests require authentication using an API key. Include your key in the Authorization header:
          </p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <code className="text-sm text-gray-800">
              Authorization: Bearer wo_live_YOUR_API_KEY
            </code>
          </div>
          
          <p className="text-gray-600 mb-4">Alternatively, use the X-API-Key header:</p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-8">
            <code className="text-sm text-gray-800">
              X-API-Key: wo_live_YOUR_API_KEY
            </code>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Keep Your Keys Secure</p>
              <p className="text-sm text-amber-700 mt-1">
                Never expose API keys in client-side code or public repositories. Keys should only be used server-side.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-16 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">API Endpoints</h2>
          </div>
          <p className="text-gray-600 mb-8">
            Base URL: <code className="bg-gray-100 px-2 py-1 rounded">https://waveorder.app/api/v1</code>
          </p>

          {/* Products */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Products</h3>
            </div>
            
            <div className="space-y-3">
              <EndpointRow 
                method="GET" 
                path="/products" 
                description="List all products (paginated)" 
                scope="products:read"
              />
              <EndpointRow 
                method="GET" 
                path="/products/:id" 
                description="Get single product" 
                scope="products:read"
              />
              <EndpointRow 
                method="POST" 
                path="/products" 
                description="Create new product" 
                scope="products:write"
              />
              <EndpointRow 
                method="PUT" 
                path="/products/:id" 
                description="Update product" 
                scope="products:write"
              />
              <EndpointRow 
                method="DELETE" 
                path="/products/:id" 
                description="Delete product" 
                scope="products:write"
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <strong>Query Parameters:</strong> page, limit (max 100), categoryId, brandId, search, isActive
            </div>
          </div>

          {/* Orders */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">Orders</h3>
            </div>
            
            <div className="space-y-3">
              <EndpointRow 
                method="GET" 
                path="/orders" 
                description="List all orders (paginated)" 
                scope="orders:read"
              />
              <EndpointRow 
                method="GET" 
                path="/orders/:id" 
                description="Get single order" 
                scope="orders:read"
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <strong>Query Parameters:</strong> page, limit (max 100), status, type (DELIVERY/PICKUP/DINE_IN), from, to
            </div>
          </div>

          {/* Categories */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="h-5 w-5 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-900">Categories</h3>
            </div>
            
            <div className="space-y-3">
              <EndpointRow 
                method="GET" 
                path="/categories" 
                description="List all categories" 
                scope="categories:read"
              />
              <EndpointRow 
                method="GET" 
                path="/categories/:id" 
                description="Get single category" 
                scope="categories:read"
              />
              <EndpointRow 
                method="POST" 
                path="/categories" 
                description="Create new category" 
                scope="categories:write"
              />
              <EndpointRow 
                method="PUT" 
                path="/categories/:id" 
                description="Update category" 
                scope="categories:write"
              />
              <EndpointRow 
                method="DELETE" 
                path="/categories/:id" 
                description="Delete category" 
                scope="categories:write"
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <strong>Query Parameters:</strong> includeProducts (boolean)
            </div>
          </div>

          {/* Account */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-orange-600" />
              <h3 className="text-xl font-semibold text-gray-900">Account</h3>
            </div>
            
            <div className="space-y-3">
              <EndpointRow 
                method="GET" 
                path="/me" 
                description="Get authenticated business info" 
                scope="any"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Rate Limiting */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">Rate Limiting</h2>
          </div>
          <p className="text-gray-600 mb-6">
            API requests are limited to <strong>60 requests per minute</strong> per API key.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Header</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4"><code className="text-teal-600">X-RateLimit-Limit</code></td>
                  <td className="py-3 px-4 text-gray-600">Maximum requests per window (60)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="text-teal-600">X-RateLimit-Remaining</code></td>
                  <td className="py-3 px-4 text-gray-600">Remaining requests in current window</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="text-teal-600">X-RateLimit-Reset</code></td>
                  <td className="py-3 px-4 text-gray-600">Seconds until rate limit resets</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="text-teal-600">Retry-After</code></td>
                  <td className="py-3 px-4 text-gray-600">Seconds to wait (only on 429 response)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Errors */}
      <section className="py-16 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">Error Handling</h2>
          </div>
          <p className="text-gray-600 mb-6">
            The API returns standard HTTP status codes and JSON error responses.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4"><code className="text-green-600">200</code></td>
                  <td className="py-3 px-4 text-gray-600">Success</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="text-green-600">201</code></td>
                  <td className="py-3 px-4 text-gray-600">Created (for POST requests)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="text-amber-600">400</code></td>
                  <td className="py-3 px-4 text-gray-600">Bad Request — Invalid parameters</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="text-red-600">401</code></td>
                  <td className="py-3 px-4 text-gray-600">Unauthorized — Missing or invalid API key</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="text-red-600">403</code></td>
                  <td className="py-3 px-4 text-gray-600">Forbidden — Missing required scope or Business plan</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="text-amber-600">404</code></td>
                  <td className="py-3 px-4 text-gray-600">Not Found — Resource doesn't exist</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="text-red-600">429</code></td>
                  <td className="py-3 px-4 text-gray-600">Too Many Requests — Rate limit exceeded</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="text-red-600">500</code></td>
                  <td className="py-3 px-4 text-gray-600">Internal Server Error</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 bg-gray-900 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Example error response:</p>
            <pre className="text-sm text-gray-100">
{`{
  "error": "Missing required scope: products:write"
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Build?
          </h2>
          <p className="text-teal-100 text-lg mb-8">
            Upgrade to Business plan to unlock API access and start integrating today.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-teal-700 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
          >
            View Pricing
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

// Endpoint Row Component
function EndpointRow({ 
  method, 
  path, 
  description, 
  scope 
}: { 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  scope: string
}) {
  const methodColors = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700'
  }

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[method]}`}>
        {method}
      </span>
      <code className="text-sm text-gray-800 font-medium">{path}</code>
      <span className="text-gray-500 text-sm flex-1">{description}</span>
      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
        {scope}
      </span>
    </div>
  )
}
