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
 * - Standard Delivery: €1.00 flat rate for all Greece
 * - Minimum order: €10.00
 * - Free shipping over €20.00 (configured in business delivery settings, not here)
 *
 * NOTE: Before running this script:
 * 1. Find the Naia Studio business ID from the database or SuperAdmin
 * 2. Create a "Standard Delivery" postal service in Admin > Configurations > Postal Services
 * 3. Copy the postal service ID
 * 4. Update BUSINESS_ID and POSTAL_SERVICE_ID below
 */

const BUSINESS_ID = '697b831ab3893369d3a6c9c2' // Naia Studio business ID
const POSTAL_SERVICE_ID = '698ccfba30496f9ac138f889' // "Standard Delivery" postal service ID

/**
 * Full list of Greek cities (from cities database)
 * Flat €1 delivery for all Greece
 */
const GREECE_CITIES = [
  'Acharnes',
  'Agia Paraskevi',
  'Agios Dimitrios',
  'Agios Efstratios',
  'Agios Nikolaos',
  'Agrinio',
  'Aidipsos',
  'Aigio',
  'Alexandroupoli',
  'Almyros',
  'Amaliada',
  'Amfissa',
  'Ampelokipoi',
  'Amyntaio',
  'Archanes',
  'Argos',
  'Argostoli',
  'Arta',
  'Atalanti',
  'Athens',
  'Chalandri',
  'Chalkida',
  'Chania',
  'Chios',
  'Corfu',
  'Corinth',
  'Dafni',
  'Deskati',
  'Didymoteicho',
  'Drama',
  'Edessa',
  'Egaleo',
  'Elassona',
  'Elounda',
  'Evosmos',
  'Farsala',
  'Ferres',
  'Filiates',
  'Florina',
  'Fournoi',
  'Galatsi',
  'Giannitsa',
  'Glyfada',
  'Grevena',
  'Gythio',
  'Heraklion',
  'Hersonissos',
  'Ierapetra',
  'Igoumenitsa',
  'Ikaria',
  'Ilio',
  'Ilioupoli',
  'Ioannina',
  'Ios',
  'Irakleio',
  'Ithaca',
  'Kalamaria',
  'Kalamata',
  'Kallithea',
  'Karditsa',
  'Karpenisi',
  'Karystos',
  'Kastoria',
  'Katerini',
  'Kavala',
  'Kefalonia',
  'Keratsini',
  'Kifisia',
  'Komotini',
  'Konitsa',
  'Kos',
  'Kozani',
  'Kythira',
  'Lamia',
  'Larissa',
  'Lefkada',
  'Lemnos',
  'Lesvos',
  'Livadeia',
  'Lixouri',
  'Malia',
  'Marousi',
  'Menemeni',
  'Messolonghi',
  'Metsovo',
  'Milos',
  'Monemvasia',
  'Mykonos',
  'Mytilene',
  'Nafpaktos',
  'Nafplio',
  'Naousa',
  'Naxos',
  'Nea Ionia',
  'Nea Smyrni',
  'Neapoli',
  'Nikaia',
  'Oinousses',
  'Orestiada',
  'Palaio Faliro',
  'Paramythia',
  'Parga',
  'Paros',
  'Patras',
  'Paxi',
  'Peristeri',
  'Petroupoli',
  'Piraeus',
  'Polichni',
  'Preveza',
  'Psara',
  'Ptolemaida',
  'Pylaia',
  'Pyrgos',
  'Rethymno',
  'Rhodes',
  'Sami',
  'Samos',
  'Santorini',
  'Serres',
  'Servia',
  'Siatista',
  'Sitia',
  'Skiathos',
  'Skopelos',
  'Soufli',
  'Sparta',
  'Stavroupoli',
  'Stylida',
  'Sykies',
  'Syros',
  'Thasos',
  'Thebes',
  'Thessaloniki',
  'Tinos',
  'Trikala',
  'Tripoli',
  'Tyrnavos',
  'Veria',
  'Volos',
  'Vyronas',
  'Xanthi',
  'Zagori',
  'Zakynthos',
  'Zografou',
]

/**
 * Pricing configuration
 * Flat rate: €1.00 for all Greece
 * Minimum order: €10.00
 */
const PRICING_CONFIG = {
  price: 1.00,
  priceWithoutTax: 0.81, // 24% VAT in Greece → 1.00 / 1.24 = 0.81
  minOrderValue: 10.00,
}

/**
 * Delivery time labels (English + Greek)
 */
const DELIVERY_TIMES = {
  en: '2-4 business days',
  el: '2-4 εργάσιμες ημέρες',
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
    console.log(`Pricing: €${PRICING_CONFIG.price.toFixed(2)} flat rate for all Greece`)
    console.log(`Min Order: €${PRICING_CONFIG.minOrderValue.toFixed(2)}\n`)

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

    // All Greece - flat €1
    console.log(`📦 Processing Greece (${GREECE_CITIES.length} cities) - €${PRICING_CONFIG.price.toFixed(2)}...`)
    const batch = await processPricingBatch(
      GREECE_CITIES,
      PRICING_CONFIG.price,
      PRICING_CONFIG.priceWithoutTax,
      PRICING_CONFIG.minOrderValue,
      DELIVERY_TIMES.en,
      DELIVERY_TIMES.el,
    )
    console.log(`   ✅ Created: ${batch.created}, Updated: ${batch.updated}, Not Found: ${batch.notFound}, Errors: ${batch.errors.length}\n`)
    totalCreated += batch.created
    totalUpdated += batch.updated
    totalNotFound += batch.notFound
    allErrors.push(...batch.errors)

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
    const expectedTotal = GREECE_CITIES.length

    console.log(`📈 Expected total records: ${expectedTotal}`)
    console.log(`   - Greece: ${GREECE_CITIES.length} cities\n`)

    console.log(`📋 Pricing Configuration:`)
    console.log(`   Greece (all cities):`)
    console.log(`     - Price: €${PRICING_CONFIG.price.toFixed(2)} (excl. tax: €${PRICING_CONFIG.priceWithoutTax.toFixed(2)})`)
    console.log(`     - Delivery: ${DELIVERY_TIMES.en} / ${DELIVERY_TIMES.el}`)
    console.log(`   Min Order: €${PRICING_CONFIG.minOrderValue.toFixed(2)}\n`)

    console.log(`💡 Reminder: Set "Free Delivery Above" to €20.00 in Admin > Configurations > Delivery Methods\n`)

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
