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

async function updateProducts(
  csvPath: string,
  businessId: string
) {
  console.log(`Reading CSV from: ${csvPath}`)
  const rows = parseCSV(csvPath)

  console.log(`\nFound ${rows.length} products to update\n`)

  let successCount = 0
  let notFoundCount = 0
  let errorCount = 0
  const notFound: string[] = []
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    
    try {
      // Validate required fields
      if (!row.Title || !row['Price (ALL)']) {
        errors.push(`Row ${i + 1}: Missing required fields: Title or Price (ALL)`)
        continue
      }

      // Skip if no SKU - we need SKU to match products
      if (!row.SKU || !row.SKU.trim()) {
        errors.push(`Row ${i + 1}: SKU is required for product matching - "${row.Title}"`)
        continue
      }

      // Find existing product by SKU
      const existingProduct = await prisma.product.findFirst({
        where: {
          businessId,
          sku: row.SKU.trim()
        }
      })

      if (!existingProduct) {
        notFoundCount++
        notFound.push(`${row.Title} (SKU: ${row.SKU.trim()})`)
        continue
      }

      // Parse price (remove any non-numeric characters except decimal point)
      const price = parseFloat(row['Price (ALL)'].replace(/[^0-9.]/g, ''))
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${i + 1}: Invalid price for "${row.Title}": ${row['Price (ALL)']}`)
        continue
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

      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: row.Title.trim(),
          nameAl: nameAl || existingProduct.nameAl, // Keep existing if not provided
          description: description || existingProduct.description,
          descriptionAl: descriptionAl || existingProduct.descriptionAl, // Keep existing if not provided
          price: finalPrice,
          originalPrice: originalPrice,
        }
      })

      successCount++
      console.log(`✓ [${i + 1}/${rows.length}] Updated: ${updatedProduct.name} (SKU: ${row.SKU.trim()}) - Price: ${finalPrice}${originalPrice ? ` (was ${price})` : ''}`)

    } catch (error) {
      errorCount++
      const errorMsg = `✗ [${i + 1}/${rows.length}] Error updating "${row.Title || 'Unknown'}": ${error instanceof Error ? error.message : String(error)}`
      errors.push(errorMsg)
      console.error(errorMsg)
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Update Complete!`)
  console.log(`✓ Successfully Updated: ${successCount}`)
  console.log(`⚠ Not Found (no matching SKU): ${notFoundCount}`)
  console.log(`✗ Errors: ${errors.length}`)
  
  if (notFound.length > 0) {
    console.log(`\nProducts Not Found (will need to be created manually):`)
    notFound.forEach(item => console.log(`  - ${item}`))
  }
  
  if (errors.length > 0) {
    console.log(`\nErrors:`)
    errors.forEach(err => console.log(`  ${err}`))
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: npx tsx scripts/update-products.ts <csv-file-path> <business-id>')
    console.log('\nExample:')
    console.log('  npx tsx scripts/update-products.ts ~/Downloads/products-export-2026-01-09.csv 695fe009d364dfb42d4c3bfc')
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

  console.log(`Updating products for business: ${business.name} (${business.slug})`)

  try {
    await updateProducts(csvPath, businessId)
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
