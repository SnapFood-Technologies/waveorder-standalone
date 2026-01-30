// app/api/admin/stores/[businessId]/products/import/route.ts
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

interface ValidatedProduct {
  row: number
  name: string
  description: string
  price: number
  category: string
  stock: number
  sku: string | null
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
    const skipInvalidRows = formData.get('skipInvalidRows') === 'true'

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    const csvText = await file.text()
    
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        message: 'CSV parsing errors', 
        errors: parseResult.errors 
      }, { status: 400 })
    }

    const rows = parseResult.data as any[]
    const categories = new Set<string>()
    const validProducts: ValidatedProduct[] = []
    const errors: ValidationError[] = []
    const skippedRows: number[] = []

    // Get existing SKUs to check for duplicates
    const existingProducts = await prisma.product.findMany({
      where: { businessId },
      select: { sku: true }
    })
    const existingSkus = new Set(existingProducts.map(p => p.sku).filter(Boolean))
    const seenSkusInFile = new Set<string>()

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 for header row and 1-based indexing
      let rowValid = true

      // Validate required fields
      if (!row.name || String(row.name).trim() === '') {
        errors.push({ row: rowNum, field: 'name', value: String(row.name || ''), error: 'Name is required' })
        rowValid = false
      }

      if (row.price === undefined || row.price === null || row.price === '') {
        errors.push({ row: rowNum, field: 'price', value: String(row.price || ''), error: 'Price is required' })
        rowValid = false
      } else {
        const price = parseFloat(row.price)
        if (isNaN(price) || price <= 0) {
          errors.push({ row: rowNum, field: 'price', value: String(row.price), error: 'Price must be a positive number' })
          rowValid = false
        }
      }

      if (!row.category || String(row.category).trim() === '') {
        errors.push({ row: rowNum, field: 'category', value: String(row.category || ''), error: 'Category is required' })
        rowValid = false
      }

      // Validate stock if provided
      if (row.stock !== undefined && row.stock !== null && row.stock !== '') {
        const stock = parseInt(row.stock)
        if (isNaN(stock) || stock < 0) {
          errors.push({ row: rowNum, field: 'stock', value: String(row.stock), error: 'Stock must be a non-negative integer' })
          rowValid = false
        }
      }

      // Validate SKU for duplicates
      if (row.sku && String(row.sku).trim() !== '') {
        const sku = String(row.sku).trim()
        if (existingSkus.has(sku)) {
          errors.push({ row: rowNum, field: 'sku', value: sku, error: 'SKU already exists in your products' })
          rowValid = false
        } else if (seenSkusInFile.has(sku)) {
          errors.push({ row: rowNum, field: 'sku', value: sku, error: 'Duplicate SKU in CSV file' })
          rowValid = false
        } else {
          seenSkusInFile.add(sku)
        }
      }

      if (rowValid) {
        categories.add(String(row.category).trim())
        validProducts.push({
          row: rowNum,
          name: String(row.name).trim(),
          description: row.description ? String(row.description).trim() : '',
          price: parseFloat(row.price),
          category: String(row.category).trim(),
          stock: row.stock !== undefined && row.stock !== null && row.stock !== '' ? parseInt(row.stock) : 0,
          sku: row.sku ? String(row.sku).trim() : null
        })
      } else {
        skippedRows.push(rowNum)
      }
    }

    // If there are errors and skipInvalidRows is false, return error
    if (errors.length > 0 && !skipInvalidRows) {
      return NextResponse.json({ 
        message: 'Validation errors found',
        valid: false,
        totalRows: rows.length,
        validRows: validProducts.length,
        errorRows: errors.length,
        errors,
        skippedRows
      }, { status: 400 })
    }

    // If no valid products, return error
    if (validProducts.length === 0) {
      return NextResponse.json({ 
        message: 'No valid products to import',
        valid: false,
        totalRows: rows.length,
        validRows: 0,
        errorRows: errors.length,
        errors,
        skippedRows
      }, { status: 400 })
    }

    // Create categories
    const existingCategories = await prisma.category.findMany({
      where: {
        businessId,
        name: { in: Array.from(categories) }
      }
    })

    const existingCategoryNames = new Set(existingCategories.map(c => c.name))
    const newCategories = Array.from(categories).filter(name => !existingCategoryNames.has(name))

    for (const categoryName of newCategories) {
      await prisma.category.create({
        data: {
          name: categoryName,
          businessId,
          isActive: true
        }
      })
    }

    const allCategories = await prisma.category.findMany({
      where: { businessId }
    })
    const categoryMap = new Map(allCategories.map(c => [c.name, c.id]))

    // Create products
    const createdProducts = []
    const importErrors: Array<{ row: number; error: string }> = []

    for (const productData of validProducts) {
      const categoryId = categoryMap.get(productData.category)
      if (!categoryId) {
        importErrors.push({ row: productData.row, error: `Category "${productData.category}" not found` })
        continue
      }

      try {
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            description: productData.description || null,
            price: productData.price,
            stock: productData.stock,
            trackInventory: true,
            isActive: true,
            featured: false,
            sku: productData.sku,
            businessId,
            categoryId,
            images: []
          }
        })

        if (productData.stock > 0) {
          await prisma.inventoryActivity.create({
            data: {
              productId: product.id,
              businessId,
              type: 'RESTOCK',
              quantity: productData.stock,
              oldStock: 0,
              newStock: productData.stock,
              reason: 'Initial stock from CSV import'
            }
          })
        }

        createdProducts.push(product)
      } catch (err: any) {
        importErrors.push({ row: productData.row, error: err.message || 'Failed to create product' })
      }
    }

    return NextResponse.json({ 
      message: 'Import completed',
      importedCount: createdProducts.length,
      skippedCount: skippedRows.length + importErrors.length,
      totalRows: rows.length,
      validationErrors: errors,
      importErrors,
      skippedRows,
      newCategoriesCreated: newCategories.length,
      products: createdProducts.map(p => ({ id: p.id, name: p.name }))
    })

  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}