// app/api/admin/stores/[businessId]/products/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import Papa from 'papaparse'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const products = await prisma.product.findMany({
      where: { businessId },
      include: {
        category: true
      }
    })

    const csvData = products.map(product => ({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category.name,
      stock: product.stock,
      sku: product.sku || '',
      active: product.isActive ? 'Yes' : 'No',
      featured: product.featured ? 'Yes' : 'No'
    }))

    const csv = Papa.unparse(csvData)
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="products.csv"'
      }
    })

  } catch (error) {
    console.error('Error exporting products:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}