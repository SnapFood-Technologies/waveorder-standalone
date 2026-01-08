import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'

const prisma = new PrismaClient()

interface CSVRow {
  ID: string
  Title: string
  'Title (AL)': string
  'Product URL': string
  'Short Description': string
  'Short Description (AL)': string
  Description: string
  'Description (AL)': string
  'Product Status': string
  'Product Type': string
  'Variations Count': string
  Brand: string
  Categories: string
  Collections: string
  Groups: string
  SKU: string
  'Article No': string
  'Additional Code': string
  Price: string
  'Price (ALL)': string
  'Price (EUR)': string
  'Sale Price': string
  'Sale Price (ALL)': string
  'Sale Price (EUR)': string
  'Sale Discount %': string
  'Enable Stock': string
  'Stock Quantity': string
  'Low Stock Threshold': string
  'Stock Status': string
  'Allow Back Order': string
  Featured: string
  'Best Seller': string
  'Product Tags': string
  Tags: string
  'Menu Order': string
  'Allow Customer Review': string
  'Enable Low Stock Alert': string
  'Image Path': string
  'Created At': string
  'Updated At': string
}

// Parse CSV using papaparse
function parseCSV(csvPath: string): CSVRow[] {
  const content = fs.readFileSync(csvPath, 'utf-8')
  const result = Papa.parse<CSVRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim()
  })

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:')
    result.errors.forEach(err => console.warn(`  - ${err.message} (row ${err.row})`))
  }

  return result.data
}

// Get or create category
async function getOrCreateCategory(
  businessId: string,
  categoryName: string
): Promise<string> {
  if (!categoryName || !categoryName.trim()) {
    throw new Error('Category name is required')
  }

  // Handle categories that might be separated by semicolons (e.g., "Cookware" or "Utensils & Tools; Cookware")
  const categoryNames = categoryName.split(';').map(c => c.trim()).filter(c => c)
  const primaryCategory = categoryNames[0] // Use first category

  // Find existing category
  let category = await prisma.category.findFirst({
    where: {
      businessId,
      name: primaryCategory
    }
  })

  if (!category) {
    // Create new category
    category = await prisma.category.create({
      data: {
        name: primaryCategory,
        businessId,
        isActive: true,
        sortOrder: 0
      }
    })
    console.log(`✓ Created category: ${primaryCategory}`)
  }

  return category.id
}

async function importProducts(
  csvPath: string,
  businessId: string
) {
  console.log(`Reading CSV from: ${csvPath}`)
  const rows = parseCSV(csvPath)

  console.log(`\nFound ${rows.length} products to import\n`)

  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    
    try {
      // Validate required fields
      if (!row.Title || !row['Price (ALL)']) {
        throw new Error('Missing required fields: Title or Price (ALL)')
      }

      // Get or create category
      const categoryId = await getOrCreateCategory(businessId, row.Categories || 'Uncategorized')

      // Parse price (remove any non-numeric characters except decimal point)
      const price = parseFloat(row['Price (ALL)'].replace(/[^0-9.]/g, ''))
      if (isNaN(price) || price < 0) {
        throw new Error(`Invalid price: ${row['Price (ALL)']}`)
      }

      // Handle sale price logic: if sale price exists and is less, use sale price as main price
      let finalPrice = price
      let originalPrice: number | null = null
      if (row['Sale Price (ALL)'] && row['Sale Price (ALL)'].trim()) {
        const salePrice = parseFloat(row['Sale Price (ALL)'].replace(/[^0-9.]/g, ''))
        if (!isNaN(salePrice) && salePrice > 0 && salePrice < price) {
          // Product is on sale: use sale price as current price, regular price as original
          finalPrice = salePrice
          originalPrice = price
        }
      }

      // Parse stock
      const trackInventory = row['Enable Stock']?.toLowerCase() === 'yes'
      const stock = trackInventory ? parseInt(row['Stock Quantity'] || '0') : 0
      const lowStockAlert = row['Low Stock Threshold'] ? parseInt(row['Low Stock Threshold']) : null

      // Parse description - prefer Description over Short Description, clean HTML
      let description = row.Description || row['Short Description'] || null
      if (description) {
        // Remove HTML tags but keep text
        description = description.replace(/<[^>]*>/g, '').trim() || null
      }
      
      // Parse Albanian description - prefer Description (AL) over Short Description (AL)
      let descriptionAl = row['Description (AL)'] || row['Short Description (AL)'] || null
      if (descriptionAl) {
        // Remove HTML tags but keep text
        descriptionAl = descriptionAl.replace(/<[^>]*>/g, '').trim() || null
      }
      
      // Parse Albanian product name
      const nameAl = row['Title (AL)']?.trim() || null

      // Parse images
      const images: string[] = []
      if (row['Image Path'] && row['Image Path'].trim()) {
        images.push(row['Image Path'].trim())
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          name: row.Title.trim(),
          nameAl: nameAl,
          description: description,
          descriptionAl: descriptionAl,
          images: images,
          price: finalPrice,
          originalPrice: originalPrice,
          sku: row.SKU?.trim() || null,
          stock: stock,
          trackInventory: trackInventory,
          lowStockAlert: lowStockAlert,
          enableLowStockNotification: row['Enable Low Stock Alert']?.toLowerCase() === 'yes',
          isActive: row['Product Status'] === '1',
          featured: row.Featured?.toLowerCase() === 'yes',
          businessId,
          categoryId,
        }
      })

      // Create inventory activity if stock > 0
      if (trackInventory && stock > 0) {
        await prisma.inventoryActivity.create({
          data: {
            productId: product.id,
            businessId,
            type: 'RESTOCK',
            quantity: stock,
            oldStock: 0,
            newStock: stock,
            reason: 'Initial stock from CSV import'
          }
        })
      }

      successCount++
      console.log(`✓ [${i + 1}/${rows.length}] Imported: ${product.name}`)

    } catch (error) {
      errorCount++
      const errorMsg = `✗ [${i + 1}/${rows.length}] Error importing "${row.Title || 'Unknown'}": ${error instanceof Error ? error.message : String(error)}`
      errors.push(errorMsg)
      console.error(errorMsg)
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Import Complete!`)
  console.log(`✓ Success: ${successCount}`)
  console.log(`✗ Errors: ${errorCount}`)
  if (errors.length > 0) {
    console.log(`\nErrors:`)
    errors.forEach(err => console.log(`  ${err}`))
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: npx tsx scripts/import-products.ts <csv-file-path> <business-id>')
    console.log('\nExample:')
    console.log('  npx tsx scripts/import-products.ts ~/Downloads/products-export-2026-01-08.csv 507f1f77bcf86cd799439011')
    process.exit(1)
  }

  const csvPath = path.resolve(args[0])
  const businessId = args[1]

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found: ${csvPath}`)
    process.exit(1)
  }

  // Verify business exists
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  })

  if (!business) {
    console.error(`Error: Business not found with ID: ${businessId}`)
    process.exit(1)
  }

  console.log(`Importing products for business: ${business.name} (${business.slug})`)

  try {
    await importProducts(csvPath, businessId)
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
