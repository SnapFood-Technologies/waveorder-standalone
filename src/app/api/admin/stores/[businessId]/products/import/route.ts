// app/api/admin/stores/[businessId]/products/import/route.ts
import Papa from 'papaparse'
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    const products: any[] = []

    for (const row of rows) {
      if (!row.name || !row.price || !row.category) {
        continue
      }

      categories.add(row.category)
      
      products.push({
        name: row.name,
        description: row.description || '',
        price: parseFloat(row.price) || 0,
        category: row.category,
        stock: parseInt(row.stock) || 0,
        sku: row.sku || null
      })
    }

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

    const createdProducts = []
    for (const productData of products) {
      const categoryId = categoryMap.get(productData.category)
      if (!categoryId) continue

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
    }

    return NextResponse.json({ 
      message: 'Import successful',
      importedCount: createdProducts.length,
      products: createdProducts 
    })

  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}