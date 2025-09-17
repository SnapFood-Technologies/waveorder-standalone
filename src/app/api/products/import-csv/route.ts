// app/api/products/import-csv/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
    }

    const csvText = await file.text()
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    const products = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      if (values.length >= headers.length && values[0].trim()) {
        const product = {
          id: Date.now().toString() + i,
          name: values[headers.indexOf('name')]?.trim() || '',
          price: parseFloat(values[headers.indexOf('price')]?.trim() || '0'),
          category: values[headers.indexOf('category')]?.trim() || 'General',
          description: values[headers.indexOf('description')]?.trim() || ''
        }
        
        if (product.name && product.price > 0) {
          products.push(product)
        }
      }
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ message: 'Error processing CSV file' }, { status: 500 })
  }
}