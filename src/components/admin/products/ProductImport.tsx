'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Download, ArrowLeft, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'

interface ImportPageProps {
    businessId: string
}

export default function ImportPage({ businessId }: ImportPageProps) {
  const { addParams } = useImpersonation(businessId)
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
      setImportResult(null)
    }
  }

  const downloadSampleCsv = () => {
    const csvContent = `name,price,category,description,stock,sku
Margherita Pizza,12.99,Main Courses,Classic pizza with tomato and mozzarella,50,PIZZA-001
Caesar Salad,8.99,Appetizers,Fresh romaine with caesar dressing,30,SALAD-001
Chocolate Cake,6.99,Desserts,Rich chocolate cake slice,20,CAKE-001
Cappuccino,4.50,Beverages,Italian coffee with steamed milk,100,COFFEE-001`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-products.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/admin/stores/${businessId}/products/import`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setImportResult(result)
      } else {
        setError(result.message || 'Import failed')
      }
    } catch (error) {
      setError('An error occurred during import')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={addParams(`/admin/stores/${businessId}/products`)}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Products</h1>
          <p className="text-gray-600 mt-1">
            Bulk import products from a CSV file
          </p>
        </div>
      </div>

      {!importResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Forms (3/5 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Download Sample CSV*/}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Download Sample CSV</h3>
              <p className="text-gray-600 mb-2">
                Download our template to see the required format for your product data.
              </p>
              <button
                onClick={downloadSampleCsv}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </button>
            </div>

            {/* File Uploads */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Upload Your CSV File</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {file ? (
                  <div className="space-y-4">
                    <FileText className="w-12 h-12 text-green-600 mx-auto" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleImport}
                        disabled={uploading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {uploading ? 'Importing...' : 'Import Products'}
                      </button>
                      <button
                        onClick={() => setFile(null)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Remove File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Choose CSV file to upload
                      </p>
                      <p className="text-gray-600 mb-4">
                        Select your CSV file with product data
                      </p>
                      <label className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 mr-2" />
                        Select CSV File
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">
                      Supported format: CSV files only
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Information (2/5 width) */}
          <div className="lg:col-span-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 sticky top-6">
              <div className="flex items-center mb-4">
                <Info className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-900">Import Instructions</h3>
              </div>
              
              <div className="space-y-4 text-blue-800">
                <div>
                  <h4 className="font-medium mb-2">Required CSV Columns:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span><strong>name</strong></span>
                      <span className="text-red-600">required</span>
                    </li>
                    <li className="flex justify-between">
                      <span><strong>price</strong></span>
                      <span className="text-red-600">required</span>
                    </li>
                    <li className="flex justify-between">
                      <span><strong>category</strong></span>
                      <span className="text-red-600">required</span>
                    </li>
                    <li className="flex justify-between">
                      <span><strong>description</strong></span>
                      <span className="text-gray-600">optional</span>
                    </li>
                    <li className="flex justify-between">
                      <span><strong>stock</strong></span>
                      <span className="text-gray-600">optional</span>
                    </li>
                    <li className="flex justify-between">
                      <span><strong>sku</strong></span>
                      <span className="text-gray-600">optional</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t border-blue-200 pt-4">
                  <h4 className="font-medium mb-2">Important Notes:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Categories will be created automatically if they don't exist</li>
                    <li>• Stock defaults to 0 if not specified</li>
                    <li>• Price should be in decimal format (e.g., 12.99)</li>
                    <li>• SKU must be unique if provided</li>
                    <li>• File size limit: 5MB</li>
                  </ul>
                </div>

                <div className="border-t border-blue-200 pt-4">
                  <h4 className="font-medium mb-2">Sample Data Format:</h4>
                  <div className="bg-blue-100 border border-blue-300 rounded p-3 text-xs font-mono overflow-x-auto">
                    <div>name,price,category,description</div>
                    <div>Pizza Margherita,12.99,Main Courses,Classic tomato and mozzarella</div>
                    <div>Caesar Salad,8.99,Appetizers,Fresh romaine lettuce</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Import Success - Full Width */
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Import Successful!</h3>
              <p className="text-gray-600 mb-6">
                Successfully imported {importResult.importedCount} products
              </p>
              
              <div className="flex gap-3 justify-center">
                <Link
                  href={addParams(`/admin/stores/${businessId}/products`)}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  View Products
                </Link>
                <button
                  onClick={() => {
                    setImportResult(null)
                    setFile(null)
                    setError('')
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Import More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}