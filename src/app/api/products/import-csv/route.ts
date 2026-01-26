import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const setupToken = formData.get('setupToken') as string | null

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ message: 'Invalid file type. Please upload a CSV file.' }, { status: 400 })
    }

    // Check authorization - session or setup token
    let authorized = false
    const session = await getServerSession(authOptions)
    
    if (session) {
      authorized = true
    } else if (setupToken) {
      const user = await prisma.user.findFirst({
        where: {
          setupToken: setupToken,
          setupExpiry: { gt: new Date() }
        }
      })
      authorized = !!user
    }

    if (!authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const csvText = await file.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ message: 'CSV file must contain a header row and at least one data row' }, { status: 400 })
    }

    // Parse headers - normalize and clean
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    
    // Validate required headers
    const requiredHeaders = ['name', 'price']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        message: `Missing required columns: ${missingHeaders.join(', ')}. Required: name, price. Optional: category, description` 
      }, { status: 400 })
    }

    const products = []
    const categories = new Set<string>()
    const errors = []
    
    for (let i = 1; i < lines.length; i++) {
      try {
        // Handle CSV parsing with potential commas in quoted fields
        const row = parseCSVRow(lines[i])
        
        if (row.length < headers.length) {
          errors.push(`Row ${i + 1}: Insufficient columns`)
          continue
        }

        const rowData: { [key: string]: string } = {}
        headers.forEach((header, index) => {
          rowData[header] = row[index]?.trim().replace(/^"|"$/g, '') || ''
        })

        // Validate required fields
        if (!rowData.name?.trim()) {
          errors.push(`Row ${i + 1}: Product name is required`)
          continue
        }

        const price = parseFloat(rowData.price)
        if (isNaN(price) || price < 0) {
          errors.push(`Row ${i + 1}: Invalid price "${rowData.price}". Must be a positive number`)
          continue
        }

        // Set default category if not provided
        const category = rowData.category?.trim() || 'General'
        categories.add(category)

        const product = {
          id: `import_${Date.now()}_${i}`,
          name: rowData.name.trim(),
          price: price,
          category: category,
          description: rowData.description?.trim() || undefined
        }
        
        products.push(product)
      } catch (error) {
        errors.push(`Row ${i + 1}: Error parsing row - ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Convert categories Set to array of objects
    const categoryObjects = Array.from(categories).map(name => ({
      id: `category_${Date.now()}_${Math.random()}`,
      name
    }))

    return NextResponse.json({ 
      products,
      categories: categoryObjects,
      summary: {
        total_rows: lines.length - 1,
        successful_imports: products.length,
        errors: errors.length,
        categories_found: categories.size
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ 
      message: 'Error processing CSV file. Please check the file format and try again.' 
    }, { status: 500 })
  }
}

// Helper function to parse CSV row handling quoted fields with commas
function parseCSVRow(row: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}