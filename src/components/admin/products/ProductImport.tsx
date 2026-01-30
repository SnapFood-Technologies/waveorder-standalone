'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Download, ArrowLeft, FileText, CheckCircle, AlertCircle, Info, AlertTriangle, X, ChevronRight, Package, Tag } from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'

interface ImportPageProps {
    businessId: string
}

interface ValidationError {
  row: number
  field: string
  value: string
  error: string
}

interface ValidationWarning {
  row: number
  field: string
  message: string
}

interface ValidatedProduct {
  name: string
  description: string
  price: number
  category: string
  stock: number
  sku: string | null
}

interface ValidationResult {
  valid: boolean
  totalRows: number
  validRows: number
  errorRows: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
  preview: ValidatedProduct[]
  categories: string[]
  newCategories: string[]
  existingCategories: string[]
  summary: {
    totalProducts: number
    validProducts: number
    invalidProducts: number
    newCategoriesCount: number
    existingCategoriesCount: number
  }
}

type Step = 'upload' | 'preview' | 'result'

export default function ImportPage({ businessId }: ImportPageProps) {
  const { addParams } = useImpersonation(businessId)
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [validating, setValidating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [skipInvalidRows, setSkipInvalidRows] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
      setValidationResult(null)
      setImportResult(null)
      setStep('upload')
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

  const handleValidate = async () => {
    if (!file) return

    setValidating(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/admin/stores/${businessId}/products/import/validate`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setValidationResult(result)
        setStep('preview')
      } else {
        setError(result.message || 'Validation failed')
      }
    } catch (error) {
      setError('An error occurred during validation')
    } finally {
      setValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (skipInvalidRows) {
        formData.append('skipInvalidRows', 'true')
      }

      const response = await fetch(`/api/admin/stores/${businessId}/products/import`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setImportResult(result)
        setStep('result')
      } else {
        setError(result.message || 'Import failed')
      }
    } catch (error) {
      setError('An error occurred during import')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setStep('upload')
    setValidationResult(null)
    setImportResult(null)
    setError('')
    setSkipInvalidRows(false)
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
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

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className={`flex items-center ${step === 'upload' ? 'text-teal-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'upload' ? 'bg-teal-100' : 'bg-green-100'
            }`}>
              {step !== 'upload' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <span className="text-sm font-medium">1</span>
              )}
            </div>
            <span className="ml-2 text-sm font-medium">Upload</span>
          </div>
          <ChevronRight className="w-5 h-5 mx-4 text-gray-300" />
          <div className={`flex items-center ${step === 'preview' ? 'text-teal-600' : step === 'result' ? 'text-gray-400' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'preview' ? 'bg-teal-100' : step === 'result' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {step === 'result' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <span className="text-sm font-medium">2</span>
              )}
            </div>
            <span className="ml-2 text-sm font-medium">Preview</span>
          </div>
          <ChevronRight className="w-5 h-5 mx-4 text-gray-300" />
          <div className={`flex items-center ${step === 'result' ? 'text-teal-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'result' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {step === 'result' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <span className="text-sm font-medium">3</span>
              )}
            </div>
            <span className="ml-2 text-sm font-medium">Complete</span>
          </div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
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
                        onClick={handleValidate}
                        disabled={validating}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {validating ? 'Validating...' : 'Validate & Preview'}
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
                      Supported format: CSV files only (max 5MB)
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && validationResult && (
        <div className="space-y-6">
          {/* Validation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{validationResult.totalRows}</div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
              <div className="text-2xl font-bold text-green-700">{validationResult.validRows}</div>
              <div className="text-sm text-green-600">Valid Products</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-200 bg-red-50">
              <div className="text-2xl font-bold text-red-700">{validationResult.errorRows}</div>
              <div className="text-sm text-red-600">Rows with Errors</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-200 bg-blue-50">
              <div className="text-2xl font-bold text-blue-700">{validationResult.newCategories.length}</div>
              <div className="text-sm text-blue-600">New Categories</div>
            </div>
          </div>

          {/* Errors Section */}
          {validationResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-red-900">
                  Validation Errors ({validationResult.errors.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-red-700">
                      <th className="pb-2 pr-4">Row</th>
                      <th className="pb-2 pr-4">Field</th>
                      <th className="pb-2 pr-4">Value</th>
                      <th className="pb-2">Error</th>
                    </tr>
                  </thead>
                  <tbody className="text-red-800">
                    {validationResult.errors.slice(0, 20).map((error, index) => (
                      <tr key={index} className="border-t border-red-200">
                        <td className="py-2 pr-4 font-medium">{error.row}</td>
                        <td className="py-2 pr-4">{error.field}</td>
                        <td className="py-2 pr-4 font-mono text-xs truncate max-w-[150px]">
                          {error.value || '(empty)'}
                        </td>
                        <td className="py-2">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validationResult.errors.length > 20 && (
                  <p className="mt-2 text-sm text-red-600">
                    ... and {validationResult.errors.length - 20} more errors
                  </p>
                )}
              </div>
              
              {/* Download Errors CSV Button */}
              <div className="mt-4 pt-4 border-t border-red-200">
                <button
                  onClick={() => {
                    // Create CSV content with error annotations
                    const errorsByRow = new Map<number, ValidationError[]>()
                    validationResult.errors.forEach(err => {
                      if (!errorsByRow.has(err.row)) {
                        errorsByRow.set(err.row, [])
                      }
                      errorsByRow.get(err.row)!.push(err)
                    })
                    
                    // Build CSV with error column
                    let csvContent = 'row,field,value,error\n'
                    validationResult.errors.forEach(err => {
                      const escapedValue = String(err.value || '').replace(/"/g, '""')
                      const escapedError = err.error.replace(/"/g, '""')
                      csvContent += `${err.row},"${err.field}","${escapedValue}","${escapedError}"\n`
                    })
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'import-errors.csv'
                    a.click()
                    window.URL.revokeObjectURL(url)
                  }}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Errors CSV
                </button>
                <p className="text-xs text-red-600 mt-2">
                  Download a CSV file with all validation errors to help fix your data
                </p>
              </div>
            </div>
          )}

          {/* Warnings Section */}
          {validationResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <h3 className="text-lg font-semibold text-yellow-900">
                  Warnings ({validationResult.warnings.length})
                </h3>
              </div>
              <ul className="text-sm text-yellow-800 space-y-1">
                {validationResult.warnings.slice(0, 10).map((warning, index) => (
                  <li key={index}>
                    Row {warning.row}, {warning.field}: {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* New Categories */}
          {validationResult.newCategories.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Tag className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-900">
                  New Categories to Create ({validationResult.newCategories.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {validationResult.newCategories.map((category, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {validationResult.preview.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Package className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Preview (First 10 Products)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Category</th>
                      <th className="pb-2 pr-4 text-right">Price</th>
                      <th className="pb-2 pr-4 text-right">Stock</th>
                      <th className="pb-2">SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.preview.map((product, index) => (
                      <tr key={index} className="border-t border-gray-100">
                        <td className="py-2 pr-4 font-medium">{product.name}</td>
                        <td className="py-2 pr-4">{product.category}</td>
                        <td className="py-2 pr-4 text-right">{formatCurrency(product.price)}</td>
                        <td className="py-2 pr-4 text-right">{product.stock}</td>
                        <td className="py-2 font-mono text-xs">{product.sku || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Options */}
          {validationResult.errors.length > 0 && validationResult.validRows > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={skipInvalidRows}
                  onChange={(e) => setSkipInvalidRows(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Skip invalid rows and import only valid products ({validationResult.validRows} products)
                </span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={handleImport}
              disabled={uploading || (validationResult.validRows === 0) || (validationResult.errors.length > 0 && !skipInvalidRows)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Importing...' : `Import ${validationResult.validRows} Products`}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && importResult && (
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
                  onClick={resetForm}
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
