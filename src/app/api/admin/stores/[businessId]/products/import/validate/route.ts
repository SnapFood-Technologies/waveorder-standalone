// src/app/api/admin/stores/[businessId]/products/import/validate/route.ts
// CSV validation API - validates CSV without importing
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'

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
  imageUrl: string | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    // Check file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        message: 'File size exceeds 5MB limit',
        valid: false
      }, { status: 400 })
    }

    const csvText = await file.text()
    
    // Parse CSV
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings for validation
      transformHeader: (header) => header.trim().toLowerCase()
    })

    if (parseResult.errors.length > 0) {
      // Check for critical parsing errors
      const criticalErrors = parseResult.errors.filter(e => e.type === 'FieldMismatch' || e.type === 'Quotes')
      if (criticalErrors.length > 0) {
        return NextResponse.json({ 
          message: 'CSV parsing errors', 
          errors: criticalErrors.map(e => ({
            row: e.row || 0,
            field: 'csv',
            value: '',
            error: e.message
          })),
          valid: false
        }, { status: 400 })
      }
    }

    const rows = parseResult.data as any[]
    
    if (rows.length === 0) {
      return NextResponse.json({ 
        message: 'CSV file is empty or has no data rows',
        valid: false,
        totalRows: 0
      }, { status: 400 })
    }

    // Check for required columns
    const headers = Object.keys(rows[0] || {})
    const requiredColumns = ['name', 'price', 'category']
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        message: `Missing required columns: ${missingColumns.join(', ')}`,
        valid: false,
        missingColumns
      }, { status: 400 })
    }

    // Get existing SKUs for duplicate check
    const existingProducts = await prisma.product.findMany({
      where: { businessId },
      select: { sku: true }
    })
    const existingSkus = new Set(existingProducts.map(p => p.sku).filter(Boolean))

    // Validate each row
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const validProducts: ValidatedProduct[] = []
    const categories = new Set<string>()
    const skusInFile = new Map<string, number>() // Track SKUs in file for duplicate detection

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 because row 1 is header, and arrays are 0-indexed
      
      // Validate name (required, non-empty)
      const name = (row.name || '').toString().trim()
      if (!name) {
        errors.push({
          row: rowNum,
          field: 'name',
          value: row.name || '',
          error: 'Name is required and cannot be empty'
        })
        continue // Skip this row
      }

      // Validate price (required, positive number)
      const priceStr = (row.price || '').toString().trim()
      const price = parseFloat(priceStr)
      if (!priceStr || isNaN(price)) {
        errors.push({
          row: rowNum,
          field: 'price',
          value: priceStr,
          error: 'Price must be a valid number'
        })
        continue
      }
      if (price <= 0) {
        errors.push({
          row: rowNum,
          field: 'price',
          value: priceStr,
          error: 'Price must be greater than 0'
        })
        continue
      }

      // Validate category (required, non-empty)
      const category = (row.category || '').toString().trim()
      if (!category) {
        errors.push({
          row: rowNum,
          field: 'category',
          value: row.category || '',
          error: 'Category is required and cannot be empty'
        })
        continue
      }

      // Validate stock (optional, must be non-negative integer)
      const stockStr = (row.stock || '0').toString().trim()
      const stock = parseInt(stockStr)
      if (stockStr && (isNaN(stock) || stock < 0)) {
        errors.push({
          row: rowNum,
          field: 'stock',
          value: stockStr,
          error: 'Stock must be a non-negative integer'
        })
        continue
      }

      // Validate SKU (optional, must be unique)
      const sku = (row.sku || '').toString().trim() || null
      if (sku) {
        // Check for duplicate in existing products
        if (existingSkus.has(sku)) {
          errors.push({
            row: rowNum,
            field: 'sku',
            value: sku,
            error: `SKU "${sku}" already exists in your products`
          })
          continue
        }
        // Check for duplicate in current file
        if (skusInFile.has(sku)) {
          errors.push({
            row: rowNum,
            field: 'sku',
            value: sku,
            error: `Duplicate SKU "${sku}" found in row ${skusInFile.get(sku)}`
          })
          continue
        }
        skusInFile.set(sku, rowNum)
      }

      // All validations passed - add to valid products
      const description = (row.description || '').toString().trim()
      
      // Handle image URL (optional) - accept 'image', 'image_url', or 'imageurl'
      const imageUrlRaw = (row.image || row.image_url || row.imageurl || '').toString().trim()
      let imageUrl: string | null = null
      
      if (imageUrlRaw) {
        // Basic URL validation
        try {
          const url = new URL(imageUrlRaw)
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            imageUrl = imageUrlRaw
          } else {
            warnings.push({
              row: rowNum,
              field: 'image',
              message: `Invalid image URL protocol (must be http or https): ${imageUrlRaw.substring(0, 50)}...`
            })
          }
        } catch {
          warnings.push({
            row: rowNum,
            field: 'image',
            message: `Invalid image URL format: ${imageUrlRaw.substring(0, 50)}...`
          })
        }
      }
      
      validProducts.push({
        name,
        description,
        price: Math.round(price * 100) / 100, // Round to 2 decimal places
        category,
        stock: isNaN(stock) ? 0 : stock,
        sku,
        imageUrl
      })

      categories.add(category)

      // Add warnings for optional issues
      if (name.length > 200) {
        warnings.push({
          row: rowNum,
          field: 'name',
          message: 'Product name is very long (>200 characters), consider shortening'
        })
      }
      if (description.length > 2000) {
        warnings.push({
          row: rowNum,
          field: 'description',
          message: 'Description is very long (>2000 characters)'
        })
      }
    }

    // Get existing categories to identify new ones
    const existingCategories = await prisma.category.findMany({
      where: { businessId },
      select: { name: true }
    })
    const existingCategoryNames = new Set(existingCategories.map(c => c.name.toLowerCase()))
    
    const newCategories = Array.from(categories).filter(
      cat => !existingCategoryNames.has(cat.toLowerCase())
    )

    const valid = errors.length === 0 && validProducts.length > 0

    return NextResponse.json({
      valid,
      totalRows: rows.length,
      validRows: validProducts.length,
      errorRows: errors.length,
      errors,
      warnings,
      preview: validProducts.slice(0, 10), // First 10 valid products
      categories: Array.from(categories),
      newCategories,
      existingCategories: Array.from(categories).filter(
        cat => existingCategoryNames.has(cat.toLowerCase())
      ),
      summary: {
        totalProducts: rows.length,
        validProducts: validProducts.length,
        invalidProducts: rows.length - validProducts.length,
        newCategoriesCount: newCategories.length,
        existingCategoriesCount: Array.from(categories).length - newCategories.length
      }
    })

  } catch (error) {
    console.error('Error validating CSV:', error)
    return NextResponse.json({ 
      message: 'Internal server error during validation',
      valid: false
    }, { status: 500 })
  }
}
