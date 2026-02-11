import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Naia Studio - Postal Pricing Population Script
 * 
 * Business: Naia Studio (Jewelry store based in Athens, Greece)
 * Currency: EUR
 * Language: Greek (el)
 * 
 * Pricing Strategy:
 * - Standard Delivery: €3.50 flat rate for all Greece
 * - Minimum order: €10.00
 * - Free shipping over €25.00 (configured in business delivery settings, not here)
 * 
 * NOTE: Before running this script:
 * 1. Find the Naia Studio business ID from the database or SuperAdmin
 * 2. Create a "Standard Delivery" postal service in Admin > Configurations > Postal Services
 * 3. Copy the postal service ID
 * 4. Update BUSINESS_ID and POSTAL_SERVICE_ID below
 */

// TODO: Update with actual IDs before running
const BUSINESS_ID = '' // Naia Studio business ID
const POSTAL_SERVICE_ID = '' // "Standard Delivery" postal service ID

/**
 * Greek cities/regions organized by area
 * Using the city name as it appears in the cities database
 */

// Athens & Attica region
const ATHENS_ATTICA_CITIES = [
  'Athens',
  'Piraeus',
  'Peristeri',
  'Kallithea',
  'Acharnes',
  'Nikaia',
  'Glyfada',
  'Voula',
  'Ilioupoli',
  'Argyroupoli',
  'Agia Paraskevi',
  'Chalandri',
  'Marousi',
  'Kifissia',
  'Palaio Faliro',
  'Nea Smyrni',
  'Nea Ionia',
  'Metamorfosi',
  'Agia Varvara',
  'Zografou',
  'Vyronas',
  'Kaisariani',
  'Galatsi',
  'Dafni',
  'Petroupoli',
  'Ilion',
  'Egaleo',
  'Korydallos',
  'Moschato',
  'Tavros',
  'Keratsini',
  'Drapetsona',
  'Eleusis',
  'Megara',
  'Lavrio',
  'Rafina',
  'Marathon',
  'Nea Makri',
  'Spata',
  'Koropi',
  'Markopoulo',
  'Vari',
  'Vouliagmeni',
  'Ekali',
  'Dionysos',
  'Drosia',
  'Nea Erythraia',
  'Lykovrysi',
  'Pefki',
  'Irakleio',
  'Nea Filadelfia',
  'Nea Chalkidona',
  'Psychiko',
  'Filothei',
  'Cholargos',
  'Papagou',
  'Vrilissia',
  'Gerakas',
  'Pallini',
  'Anthousa',
  'Penteli',
  'Melissia',
  'Nea Penteli',
]

// Mainland Greece (outside Attica)
const MAINLAND_GREECE_CITIES = [
  'Thessaloniki',
  'Patras',
  'Larissa',
  'Volos',
  'Ioannina',
  'Kavala',
  'Kalamata',
  'Serres',
  'Alexandroupoli',
  'Xanthi',
  'Komotini',
  'Drama',
  'Veria',
  'Kozani',
  'Trikala',
  'Karditsa',
  'Lamia',
  'Chalkida',
  'Agrinio',
  'Tripoli',
  'Sparti',
  'Corinth',
  'Argos',
  'Nafplio',
  'Katerini',
  'Ptolemaida',
  'Florina',
  'Kastoria',
  'Grevena',
  'Edessa',
  'Naousa',
  'Kilkis',
  'Polygyros',
  'Preveza',
  'Arta',
  'Lefkada',
  'Messolonghi',
  'Livadia',
  'Thebes',
  'Amfissa',
  'Pyrgos',
  'Zakynthos',
  'Corfu',
]

// Greek Islands
const ISLAND_CITIES = [
  'Heraklion',
  'Chania',
  'Rethymno',
  'Agios Nikolaos',
  'Sitia',
  'Ierapetra',
  'Rhodes',
  'Kos',
  'Kalymnos',
  'Mytilene',
  'Chios',
  'Samos',
  'Ermoupoli',
  'Mykonos',
  'Naxos',
  'Paros',
  'Thira',
  'Tinos',
  'Andros',
  'Skiathos',
]

/**
 * Pricing configuration
 * Flat rate: €3.50 for all Greece
 * Minimum order: €10.00
 */
const PRICING_CONFIG = {
  standard: {
    price: 3.50,
    priceWithoutTax: 2.82, // 24% VAT in Greece → 3.50 / 1.24 = 2.82
    minOrderValue: 10.00,
  }
}

/**
 * Delivery time labels (English + Greek)
 */
const DELIVERY_TIMES = {
  athensAttica: {
    en: '1-2 business days',
    el: '1-2 εργάσιμες ημέρες',
  },
  mainlandGreece: {
    en: '2-4 business days',
    el: '2-4 εργάσιμες ημέρες',
  },
  islands: {
    en: '3-5 business days',
    el: '3-5 εργάσιμες ημέρες',
  }
}

/**
 * Find city by name in Greece (country code GR)
 */
async function findGreekCity(cityName: string): Promise<{ id: string; name: string } | null> {
  try {
    const city = await prisma.city.findFirst({
      where: {
        name: cityName,
        state: {
          country: {
            code: 'GR'
          }
        }
      }
    })

    if (city) return { id: city.id, name: city.name }

    // Try case-insensitive search with starts-with
    const cityAlt = await prisma.city.findFirst({
      where: {
        name: { startsWith: cityName.substring(0, 4) },
        state: {
          country: {
            code: 'GR'
          }
        }
      }
    })

    if (cityAlt) return { id: cityAlt.id, name: cityAlt.name }

    return null
  } catch (error) {
    console.error(`Error finding city ${cityName}:`, error)
    return null
  }
}

/**
 * Create or update postal pricing record
 */
async function upsertPostalPricing(
  cityName: string,
  price: number,
  priceWithoutTax: number,
  minOrderValue: number,
  deliveryTime: string,
  deliveryTimeEl: string
): Promise<{ created: boolean; updated: boolean; error?: string }> {
  try {
    // Check for existing record
    const existing = await prisma.postalPricing.findFirst({
      where: {
        businessId: BUSINESS_ID,
        postalId: POSTAL_SERVICE_ID,
        cityName: cityName,
        type: 'normal',
        deletedAt: null
      }
    })

    if (existing) {
      // Update existing record
      await prisma.postalPricing.update({
        where: { id: existing.id },
        data: {
          price,
          priceWithoutTax,
          minOrderValue,
          deliveryTime,
          deliveryTimeEl,
        }
      })
      return { created: false, updated: true }
    } else {
      // Create new record
      try {
        await prisma.postalPricing.create({
          data: {
            businessId: BUSINESS_ID,
            postalId: POSTAL_SERVICE_ID,
            cityName: cityName,
            type: 'normal',
            price,
            priceWithoutTax,
            minOrderValue,
            deliveryTime,
            deliveryTimeEl,
          }
        })
        return { created: true, updated: false }
      } catch (createError: any) {
        // Handle unique constraint violation
        if (createError.code === 'P2002') {
          const existingRecord = await prisma.postalPricing.findFirst({
            where: {
              businessId: BUSINESS_ID,
              postalId: POSTAL_SERVICE_ID,
              cityName: cityName,
              type: 'normal'
            }
          })

          if (existingRecord) {
            await prisma.postalPricing.update({
              where: { id: existingRecord.id },
              data: {
                price,
                priceWithoutTax,
                minOrderValue,
                deliveryTime,
                deliveryTimeEl,
                deletedAt: null // Undelete if soft-deleted
              }
            })
            return { created: false, updated: true }
          }
        }
        throw createError
      }
    }
  } catch (error: any) {
    return { created: false, updated: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Process pricing batch for a list of cities
 */
async function processPricingBatch(
  cityNames: string[],
  price: number,
  priceWithoutTax: number,
  minOrderValue: number,
  deliveryTime: string,
  deliveryTimeEl: string,
): Promise<{ created: number; updated: number; notFound: number; errors: Array<{ city: string; error: string }> }> {
  const results = {
    created: 0,
    updated: 0,
    notFound: 0,
    errors: [] as Array<{ city: string; error: string }>
  }

  for (const cityName of cityNames) {
    // Find city in Greece database
    const cityInfo = await findGreekCity(cityName)
    
    if (!cityInfo) {
      // If city not found in DB, still create pricing with the provided name
      // This allows manual city entries that may not be in the cities database
      console.log(`   ⚠️  City "${cityName}" not in DB, creating with provided name`)
    }

    // Use actual city name from DB if found, otherwise use the provided name
    const actualCityName = cityInfo ? cityInfo.name : cityName

    const result = await upsertPostalPricing(
      actualCityName,
      price,
      priceWithoutTax,
      minOrderValue,
      deliveryTime,
      deliveryTimeEl,
    )

    if (result.error) {
      results.errors.push({ city: cityName, error: result.error })
    } else if (result.created) {
      results.created++
    } else if (result.updated) {
      results.updated++
    }
  }

  return results
}

/**
 * Main execution
 */
async function main() {
  // Validate configuration
  if (!BUSINESS_ID) {
    console.error('❌ BUSINESS_ID is not set. Please update the script with the Naia Studio business ID.')
    process.exit(1)
  }

  if (!POSTAL_SERVICE_ID) {
    console.error('❌ POSTAL_SERVICE_ID is not set. Please create a "Standard Delivery" postal service first and update this script.')
    process.exit(1)
  }

  try {
    console.log('🚀 Starting Naia Studio postal pricing population...\n')
    console.log(`Business: Naia Studio (Athens, Greece)`)
    console.log(`Business ID: ${BUSINESS_ID}`)
    console.log(`Postal Service ID: ${POSTAL_SERVICE_ID}`)
    console.log(`Currency: EUR`)
    console.log(`Pricing: €${PRICING_CONFIG.standard.price.toFixed(2)} flat rate`)
    console.log(`Min Order: €${PRICING_CONFIG.standard.minOrderValue.toFixed(2)}\n`)

    // Verify postal service exists and belongs to this business
    const postalService = await prisma.postal.findUnique({
      where: { id: POSTAL_SERVICE_ID }
    })

    if (!postalService || postalService.businessId !== BUSINESS_ID) {
      console.error('❌ Postal service not found or does not belong to this business')
      process.exit(1)
    }

    console.log(`✅ Postal service verified: "${postalService.name}"\n`)

    let totalCreated = 0
    let totalUpdated = 0
    let totalNotFound = 0
    const allErrors: Array<{ city: string; error: string }> = []

    // Athens & Attica
    console.log(`📦 Processing Athens & Attica (${ATHENS_ATTICA_CITIES.length} cities)...`)
    const batch1 = await processPricingBatch(
      ATHENS_ATTICA_CITIES,
      PRICING_CONFIG.standard.price,
      PRICING_CONFIG.standard.priceWithoutTax,
      PRICING_CONFIG.standard.minOrderValue,
      DELIVERY_TIMES.athensAttica.en,
      DELIVERY_TIMES.athensAttica.el,
    )
    console.log(`   ✅ Created: ${batch1.created}, Updated: ${batch1.updated}, Not Found: ${batch1.notFound}, Errors: ${batch1.errors.length}\n`)
    totalCreated += batch1.created
    totalUpdated += batch1.updated
    totalNotFound += batch1.notFound
    allErrors.push(...batch1.errors)

    // Mainland Greece
    console.log(`📦 Processing Mainland Greece (${MAINLAND_GREECE_CITIES.length} cities)...`)
    const batch2 = await processPricingBatch(
      MAINLAND_GREECE_CITIES,
      PRICING_CONFIG.standard.price,
      PRICING_CONFIG.standard.priceWithoutTax,
      PRICING_CONFIG.standard.minOrderValue,
      DELIVERY_TIMES.mainlandGreece.en,
      DELIVERY_TIMES.mainlandGreece.el,
    )
    console.log(`   ✅ Created: ${batch2.created}, Updated: ${batch2.updated}, Not Found: ${batch2.notFound}, Errors: ${batch2.errors.length}\n`)
    totalCreated += batch2.created
    totalUpdated += batch2.updated
    totalNotFound += batch2.notFound
    allErrors.push(...batch2.errors)

    // Greek Islands
    console.log(`📦 Processing Greek Islands (${ISLAND_CITIES.length} cities)...`)
    const batch3 = await processPricingBatch(
      ISLAND_CITIES,
      PRICING_CONFIG.standard.price,
      PRICING_CONFIG.standard.priceWithoutTax,
      PRICING_CONFIG.standard.minOrderValue,
      DELIVERY_TIMES.islands.en,
      DELIVERY_TIMES.islands.el,
    )
    console.log(`   ✅ Created: ${batch3.created}, Updated: ${batch3.updated}, Not Found: ${batch3.notFound}, Errors: ${batch3.errors.length}\n`)
    totalCreated += batch3.created
    totalUpdated += batch3.updated
    totalNotFound += batch3.notFound
    allErrors.push(...batch3.errors)

    // Final summary
    console.log('='.repeat(60))
    console.log('✅ Naia Studio postal pricing population completed!\n')
    console.log('📊 Summary:')
    console.log(`   ✅ Created: ${totalCreated} records`)
    console.log(`   🔄 Updated: ${totalUpdated} records`)
    console.log(`   ⚠️  Not Found in DB: ${totalNotFound} cities`)
    console.log(`   ❌ Errors: ${allErrors.length}\n`)

    if (allErrors.length > 0) {
      console.log('❌ Errors encountered:')
      allErrors.forEach(err => {
        console.log(`   - ${err.city}: ${err.error}`)
      })
      console.log('')
    }

    // Expected totals
    const expectedTotal = ATHENS_ATTICA_CITIES.length + MAINLAND_GREECE_CITIES.length + ISLAND_CITIES.length
    
    console.log(`📈 Expected total records: ${expectedTotal}`)
    console.log(`   - Athens & Attica: ${ATHENS_ATTICA_CITIES.length} cities`)
    console.log(`   - Mainland Greece: ${MAINLAND_GREECE_CITIES.length} cities`)
    console.log(`   - Greek Islands: ${ISLAND_CITIES.length} cities\n`)

    console.log(`📋 Pricing Configuration:`)
    console.log(`   Standard Delivery:`)
    console.log(`     - Price: €${PRICING_CONFIG.standard.price.toFixed(2)} (excl. tax: €${PRICING_CONFIG.standard.priceWithoutTax.toFixed(2)})`)
    console.log(`     - Min Order: €${PRICING_CONFIG.standard.minOrderValue.toFixed(2)}`)
    console.log(`   Delivery Times:`)
    console.log(`     - Athens & Attica: ${DELIVERY_TIMES.athensAttica.en} / ${DELIVERY_TIMES.athensAttica.el}`)
    console.log(`     - Mainland Greece: ${DELIVERY_TIMES.mainlandGreece.en} / ${DELIVERY_TIMES.mainlandGreece.el}`)
    console.log(`     - Greek Islands: ${DELIVERY_TIMES.islands.en} / ${DELIVERY_TIMES.islands.el}\n`)

    console.log(`💡 Reminder: Set "Free Delivery Threshold" to €25.00 in Admin > Configurations > Delivery Methods\n`)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main()
