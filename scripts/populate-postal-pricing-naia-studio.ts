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
 * Delivery time labels by region (from user's cities JSON)
 * Athens/Attica: 1 day | Mainland: 2-4 days | Islands: 3-5 days
 */
const DELIVERY_TIMES = {
  athensAttica: { en: '1 business day', el: '1 εργάσιμη ημέρα' },
  mainland: { en: '2-4 business days', el: '2-4 εργάσιμες ημέρες' },
  islands: { en: '3-5 business days', el: '3-5 εργάσιμες ημέρες' },
}

// Attica region (from JSON state.name === "Attica") - 1 day
const ATHENS_ATTICA_CITIES = [
  'Acharnes', 'Agia Paraskevi', 'Agios Dimitrios', 'Athens', 'Chalandri', 'Dafni',
  'Egaleo', 'Evosmos', 'Galatsi', 'Glyfada', 'Ilio', 'Ilioupoli', 'Irakleio',
  'Kallithea', 'Keratsini', 'Kifisia', 'Marousi', 'Nea Ionia', 'Nea Smyrni',
  'Nikaia', 'Palaio Faliro', 'Peristeri', 'Petroupoli', 'Piraeus', 'Vyronas', 'Zografou',
]

// Crete, North Aegean, South Aegean, Ionian Islands - 3-5 days
const ISLAND_CITIES = [
  'Agios Efstratios', 'Agios Nikolaos', 'Archanes', 'Argostoli', 'Chania', 'Chios',
  'Corfu', 'Elounda', 'Fournoi', 'Heraklion', 'Hersonissos', 'Ierapetra', 'Ikaria',
  'Ios', 'Ithaca', 'Kefalonia', 'Kos', 'Kythira', 'Lemnos', 'Lesvos', 'Lixouri',
  'Malia', 'Milos', 'Monemvasia', 'Mykonos', 'Mytilene', 'Naxos', 'Oinousses',
  'Paros', 'Paxi', 'Psara', 'Rethymno', 'Rhodes', 'Sami', 'Samos', 'Santorini',
  'Sitia', 'Skiathos', 'Skopelos', 'Syros', 'Thasos', 'Tinos',
]

// Central Greece, Eastern Macedonia and Thrace, Epirus, Peloponnese, Thessaly, Western Greece, Western Macedonia, Central Macedonia - 2-4 days
const MAINLAND_CITIES = [
  'Aidipsos', 'Aigio', 'Agrinio', 'Alexandroupoli', 'Almyros', 'Amaliada', 'Amfissa',
  'Ampelokipoi', 'Amyntaio', 'Argos', 'Arta', 'Atalanti', 'Chalkida', 'Corinth',
  'Deskati', 'Didymoteicho',
  'Drama', 'Edessa', 'Elassona', 'Farsala', 'Ferres', 'Filiates', 'Florina', 'Giannitsa',
  'Grevena', 'Gythio', 'Igoumenitsa', 'Ioannina', 'Kalamaria', 'Kalamata', 'Karditsa',
  'Karpenisi', 'Karystos', 'Kastoria', 'Katerini', 'Kavala', 'Komotini', 'Konitsa',
  'Kozani', 'Lamia', 'Larissa', 'Lefkada', 'Livadeia', 'Menemeni', 'Messolonghi',
  'Metsovo', 'Nafpaktos', 'Nafplio', 'Naousa', 'Neapoli', 'Orestiada', 'Paramythia',
  'Parga', 'Patras', 'Polichni', 'Preveza', 'Ptolemaida', 'Pylaia', 'Pyrgos',
  'Serres', 'Servia', 'Siatista', 'Soufli', 'Sparta', 'Stavroupoli', 'Stylida',
  'Sykies', 'Thebes', 'Thessaloniki', 'Trikala', 'Tripoli', 'Tyrnavos', 'Veria',
  'Volos', 'Xanthi', 'Zagori', 'Zakynthos',
]

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

    // Athens & Attica - 1 day
    console.log(`📦 Athens & Attica (${ATHENS_ATTICA_CITIES.length} cities) - €${PRICING_CONFIG.price.toFixed(2)} - 1 day`)
    const b1 = await processPricingBatch(ATHENS_ATTICA_CITIES, PRICING_CONFIG.price, PRICING_CONFIG.priceWithoutTax, PRICING_CONFIG.minOrderValue, DELIVERY_TIMES.athensAttica.en, DELIVERY_TIMES.athensAttica.el)
    totalCreated += b1.created
    totalUpdated += b1.updated
    allErrors.push(...b1.errors)

    // Mainland - 2-4 days
    console.log(`📦 Mainland Greece (${MAINLAND_CITIES.length} cities) - €${PRICING_CONFIG.price.toFixed(2)} - 2-4 days`)
    const b2 = await processPricingBatch(MAINLAND_CITIES, PRICING_CONFIG.price, PRICING_CONFIG.priceWithoutTax, PRICING_CONFIG.minOrderValue, DELIVERY_TIMES.mainland.en, DELIVERY_TIMES.mainland.el)
    totalCreated += b2.created
    totalUpdated += b2.updated
    allErrors.push(...b2.errors)

    // Islands - 3-5 days
    console.log(`📦 Greek Islands (${ISLAND_CITIES.length} cities) - €${PRICING_CONFIG.price.toFixed(2)} - 3-5 days`)
    const b3 = await processPricingBatch(ISLAND_CITIES, PRICING_CONFIG.price, PRICING_CONFIG.priceWithoutTax, PRICING_CONFIG.minOrderValue, DELIVERY_TIMES.islands.en, DELIVERY_TIMES.islands.el)
    totalCreated += b3.created
    totalUpdated += b3.updated
    allErrors.push(...b3.errors)

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

    const expectedTotal = ATHENS_ATTICA_CITIES.length + MAINLAND_CITIES.length + ISLAND_CITIES.length

    console.log(`📈 Expected total records: ${expectedTotal}`)
    console.log(`   Athens & Attica: ${ATHENS_ATTICA_CITIES.length} (1 day) | Mainland: ${MAINLAND_CITIES.length} (2-4 days) | Islands: ${ISLAND_CITIES.length} (3-5 days)\n`)

    console.log(`📋 Pricing: €${PRICING_CONFIG.price.toFixed(2)} all Greece | Min Order: €${PRICING_CONFIG.minOrderValue.toFixed(2)}\n`)

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
