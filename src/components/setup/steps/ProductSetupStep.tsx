'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { ArrowLeft, Plus, Upload, Download, Package, Smartphone, DollarSign } from 'lucide-react'

interface ProductSetupStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

interface Product {
  id: string
  name: string
  price: number
  category: string
  description?: string
}

const sampleCategories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Specials']

export default function ProductSetupStep({ data, onComplete, onBack }: ProductSetupStepProps) {
  const [setupMethod, setSetupMethod] = useState<'manual' | 'csv' | null>(null)
  const [products, setProducts] = useState<Product[]>(data.products || [])
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: sampleCategories[0],
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvUploading, setCsvUploading] = useState(false)

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) return

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      description: newProduct.description || undefined
    }

    setProducts(prev => [...prev, product])
    setNewProduct({ name: '', price: '', category: sampleCategories[0], description: '' })
  }

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setCsvUploading(true)

    // Simulate CSV processing
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock parsed products from CSV
    const mockProducts: Product[] = [
      { id: '1', name: 'Caesar Salad', price: 12.99, category: 'Appetizers', description: 'Fresh romaine lettuce with parmesan' },
      { id: '2', name: 'Grilled Salmon', price: 24.99, category: 'Main Courses', description: 'Atlantic salmon with lemon butter' },
      { id: '3', name: 'Chocolate Cake', price: 8.99, category: 'Desserts', description: 'Rich chocolate layer cake' },
    ]

    setProducts(prev => [...prev, ...mockProducts])
    setCsvUploading(false)
    setCsvFile(null)
  }

  const downloadSampleCsv = () => {
    const csvContent = `name,price,category,description
Caesar Salad,12.99,Appetizers,Fresh romaine lettuce with parmesan
Grilled Salmon,24.99,Main Courses,Atlantic salmon with lemon butter
Chocolate Cake,8.99,Desserts,Rich chocolate layer cake
Iced Tea,3.99,Beverages,Freshly brewed sweet tea`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-products.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSubmit = async (skip = false) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete({ products: skip ? [] : products })
    setLoading(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Side - Main Content */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Add your products
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Set up your menu so customers can browse and order
            </p>
          </div>

          {!setupMethod ? (
            /* Method Selection */
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              <button
                onClick={() => setSetupMethod('manual')}
                className="w-full p-4 sm:p-6 border-2 border-gray-200 rounded-xl text-left hover:border-teal-300 hover:bg-teal-50 transition-all"
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      Manual Entry
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Add products one by one with our easy form
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSetupMethod('csv')}
                className="w-full p-4 sm:p-6 border-2 border-gray-200 rounded-xl text-left hover:border-teal-300 hover:bg-teal-50 transition-all"
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      CSV Import
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3">
                      Bulk upload your catalog from a spreadsheet
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadSampleCsv()
                      }}
                      className="inline-flex items-center text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Download sample CSV
                    </button>
                  </div>
                </div>
              </button>
            </div>
          ) : setupMethod === 'manual' ? (
            /* Manual Entry */
            <div className="space-y-4 sm:space-y-6">
              {/* Add Product Form */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>
                
                <div className="space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Margherita Pizza"
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                    />
                  </div>

                  {/* Price & Category Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="0.00"
                          className="pl-10 w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                      >
                        {sampleCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                    />
                  </div>

                  <button
                    onClick={addProduct}
                    disabled={!newProduct.name || !newProduct.price}
                    className="w-full px-4 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Product
                  </button>
                </div>
              </div>

              {/* Product List */}
              {products.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Added Products ({products.length})
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {products.map(product => (
                      <div key={product.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">
                            {product.category} • ${product.price.toFixed(2)}
                          </div>
                          {product.description && (
                            <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm self-start sm:self-center px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CSV Import */
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                  <div className="mb-4">
                    <p className="text-sm sm:text-base text-gray-600 mb-3">Drag and drop your CSV file here, or</p>
                    <label className="inline-flex items-center px-4 py-3 sm:py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 cursor-pointer transition-colors text-sm sm:text-base">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                        disabled={csvUploading}
                      />
                    </label>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-gray-500">
                    Supported format: CSV with columns: name, price, category, description
                  </div>

                  {csvUploading && (
                    <div className="mt-4 flex items-center justify-center text-teal-600">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-teal-600 mr-2"></div>
                      <span className="text-sm sm:text-base">Processing CSV...</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={downloadSampleCsv}
                    className="inline-flex items-center text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Download sample CSV template
                  </button>
                </div>
              </div>

              {products.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Imported Products ({products.length})
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {products.map(product => (
                      <div key={product.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">
                            {product.category} • ${product.price.toFixed(2)}
                          </div>
                          {product.description && (
                            <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm self-start sm:self-center px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Method Switch */}
          {setupMethod && (
            <div className="flex justify-center my-6">
              <button
                onClick={() => setSetupMethod(null)}
                className="text-teal-600 hover:text-teal-700 font-medium text-sm sm:text-base"
              >
                Choose different method
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors order-3 sm:order-1"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
              >
                Skip - I'll add products later
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
              >
                {loading ? 'Continue...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Live Preview */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-teal-600" />
              Catalog Preview
            </h3>
            
            <div className="bg-gray-100 rounded-xl p-3 sm:p-4">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-3 sm:py-4 text-white text-center">
                  <h2 className="text-base sm:text-lg font-bold">{data.businessName || 'Your Business'}</h2>
                </div>

                {/* Products */}
                <div className="p-3 sm:p-4">
                  {products.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-gray-500">
                      <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-xs sm:text-sm">No products added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {products.slice(0, 4).map(product => (
                        <div key={product.id} className="flex justify-between items-start p-2 sm:p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{product.name}</h4>
                            <p className="text-xs text-gray-600 mt-0.5">{product.category}</p>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-teal-600 flex-shrink-0">
                            ${product.price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                      
                      {products.length > 4 && (
                        <div className="text-center py-2 text-xs sm:text-sm text-gray-500">
                          +{products.length - 4} more products
                        </div>
                      )}
                    </div>
                  )}
                  
                  {products.length > 0 && (
                    <button className="w-full mt-3 sm:mt-4 bg-green-500 text-white rounded-lg p-2 sm:p-3 text-xs sm:text-sm font-medium">
                      Order via WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}