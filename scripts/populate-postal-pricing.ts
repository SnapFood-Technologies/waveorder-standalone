import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Business ID
 */
const BUSINESS_ID = '695fe009d364dfb42d4c3bfc'

/**
 * Postal Service IDs (from your provided data)
 */
const POSTAL_SERVICE_IDS = {
  normal: '6961539cb0d1e78c3aad335e', // GED Normal
  express: '6961536fb0d1e78c3aad335d' // GED Express
}

/**
 * City names organized by region
 */
const TIRANA_DISTRICTS_CITY_NAMES = [
  'Kamëz',
  'Kavajë',
  'Rrogozhinë',
  'Tiranë',
  'Vorë'
]

const ALBANIA_OTHER_CITY_NAMES = [
  'Berat',
  'Kuçovë',
  'Poliçan',
  'Skrapar',
  'Ura Vajgurore',
  'Bulqizë',
  'Dibër',
  'Klos',
  'Mat',
  'Durrës',
  'Krujë',
  'Shijak',
  'Belsh',
  'Cërrik',
  'Elbasan',
  'Gramsh',
  'Librazhd',
  'Peqin',
  'Prrenjas',
  'Divjakë',
  'Fier',
  'Lushnje',
  'Mallakastër',
  'Patos',
  'Roskovec',
  'Dropull',
  'Gjirokastër',
  'Kelcyrë',
  'Libohovë',
  'Memaliaj',
  'Përmet',
  'Tepelenë',
  'Devoll',
  'Kolonjë',
  'Korçë',
  'Maliq',
  'Pogradec',
  'Pustec',
  'Has',
  'Kukës',
  'Tropojë',
  'Kurbin',
  'Lezhë',
  'Mirditë',
  'Fushë Arrës',
  'Malësi e Madhe',
  'Pukë',
  'Shkodër',
  'Vau i Dejës',
  'Delvinë',
  'Finiq',
  'Himarë',
  'Konispol',
  'Sarandë',
  'Selenicë',
  'Vlorë'
]

const KOSOVO_CITY_NAMES = [
  'Deçan',
  'Dragash',
  'Drenas',
  'Ferizaj',
  'Fushë-Kosovë',
  'Gjakova',
  'Gjilan',
  'Gllogoc',
  'Graçanicë',
  'Hani i Elezit',
  'Istog',
  'Junik',
  'Kaçanik',
  'Kamenica',
  'Klinë',
  'Kllokot',
  'Leposaviq',
  'Lipjan',
  'Malishevë',
  'Mamushë',
  'Novobërdë',
  'Obiliq',
  'Partesh',
  'Peje',
  'Podujevë',
  'Prishtinë',
  'Prizren',
  'Rahovec',
  'Ranillug',
  'Shtërpcë',
  'Shtime',
  'Skenderaj',
  'Suhareka',
  'Vitia',
  'Vushtrri',
  'Zubin Potok',
  'Zveçan'
]

const NORTH_MACEDONIA_CITY_NAMES = [
  'Berovo',
  'Bitola',
  'Bogdanci',
  'Debar',
  'Delčevo',
  'Demir Hisar',
  'Demir Kapija',
  'Gevgelija',
  'Gostivar',
  'Kavadarci',
  'Kičevo',
  'Kočani',
  'Kratovo',
  'Kriva Palanka',
  'Kruševo',
  'Kumanova',
  'Makedonska Kamenica',
  'Makedonski Brod',
  'Negotino',
  'Ohrid',
  'Pehčevo',
  'Prilep',
  'Probištip',
  'Radoviš',
  'Resen',
  'Skopje',
  'Štip',
  'Struga',
  'Strumica',
  'Sveti Nikole',
  'Tetovo',
  'Valandovo',
  'Veles',
  'Vinica'
]

/**
 * Pricing configuration
 */
const PRICING_CONFIG = {
  // Tirana Districts
  tiranaDistricts: {
    normal: { price: 150, priceWithoutTax: 125 }, // 20% tax
    express: { price: 500, priceWithoutTax: 416.67 }
  },
  // Other Albania
  albaniaOther: {
    normal: { price: 330, priceWithoutTax: 275 }, // 20% tax
    express: { price: 700, priceWithoutTax: 583.33 }
  },
  // Kosovo (same price for Normal and Express)
  kosovo: {
    normal: { price: 600, priceWithoutTax: 500 },
    express: { price: 600, priceWithoutTax: 500 }
  },
  // Macedonia (same price for Normal and Express)
  macedonia: {
    normal: { price: 700, priceWithoutTax: 583.33 },
    express: { price: 700, priceWithoutTax: 583.33 }
  }
}

/**
 * Delivery time overrides
 */
const DELIVERY_TIMES = {
  tiranaDistricts: {
    normal: 'Koha e Dorëzimit: ~24 Orë',
    normalAl: 'Koha e Dorëzimit: ~24 Orë',
    express: 'Koha e Dorëzimit: ~3-4 Orë',
    expressAl: 'Koha e Dorëzimit: ~3-4 Orë'
  },
  albaniaOther: {
    normal: 'Koha e Dorëzimit: ~48 Orë',
    normalAl: 'Koha e Dorëzimit: ~48 Orë',
    express: 'Koha e Dorëzimit: ~9-12 Orë',
    expressAl: 'Koha e Dorëzimit: ~9-12 Orë'
  },
  kosovoMacedonia: {
    normal: 'Koha e Dorëzimit: ~3-5 Ditë',
    normalAl: 'Koha e Dorëzimit: ~3-5 Ditë',
    express: 'Koha e Dorëzimit: ~48 Orë',
    expressAl: 'Koha e Dorëzimit: ~48 Orë'
  }
}

/**
 * Find city by name and return both ID and actual name from database
 */
async function findCityByName(cityName: string): Promise<{ id: string; name: string } | null> {
  try {
    // Try exact match first for each country
    // First try Albania
    let city = await prisma.city.findFirst({
      where: {
        name: cityName, // Exact match
        state: {
          country: {
            code: 'AL'
          }
        }
      }
    })

    if (city) return { id: city.id, name: city.name }

    // Try Kosovo
    city = await prisma.city.findFirst({
      where: {
        name: cityName, // Exact match
        state: {
          country: {
            code: 'XK'
          }
        }
      }
    })

    if (city) return { id: city.id, name: city.name }

    // Try North Macedonia
    city = await prisma.city.findFirst({
      where: {
        name: cityName, // Exact match
        state: {
          country: {
            code: 'MK'
          }
        }
      }
    })

    if (city) return { id: city.id, name: city.name }

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
  postalId: string,
  type: 'normal' | 'fast',
  price: number,
  priceWithoutTax: number,
  deliveryTime?: string,
  deliveryTimeAl?: string
): Promise<{ created: boolean; updated: boolean; error?: string }> {
  try {
    // MongoDB doesn't support mode: 'insensitive', so use exact match
    // Try to find existing record with exact cityName match
    const existing = await prisma.postalPricing.findFirst({
      where: {
        businessId: BUSINESS_ID,
        postalId: postalId,
        cityName: cityName, // Exact match (case-sensitive)
        type: type,
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
          deliveryTime: deliveryTime || null,
          deliveryTimeAl: deliveryTimeAl || null
        }
      })
      return { created: false, updated: true }
    } else {
      // Try to create new record - if it fails due to unique constraint, find and update
      try {
        await prisma.postalPricing.create({
          data: {
            businessId: BUSINESS_ID,
            postalId: postalId,
            cityName: cityName,
            type: type,
            price,
            priceWithoutTax,
            deliveryTime: deliveryTime || null,
            deliveryTimeAl: deliveryTimeAl || null
          }
        })
        return { created: true, updated: false }
      } catch (createError: any) {
        // If unique constraint violation, the record exists (possibly soft-deleted or case mismatch)
        // Try to find it without deletedAt filter
        if (createError.code === 'P2002') {
          const existingRecord = await prisma.postalPricing.findFirst({
            where: {
              businessId: BUSINESS_ID,
              postalId: postalId,
              cityName: cityName,
              type: type
            }
          })

          if (existingRecord) {
            // Update existing record (including undelete if soft-deleted)
            await prisma.postalPricing.update({
              where: { id: existingRecord.id },
              data: {
                price,
                priceWithoutTax,
                deliveryTime: deliveryTime || null,
                deliveryTimeAl: deliveryTimeAl || null,
                deletedAt: null // Undelete if it was soft-deleted
              }
            })
            return { created: false, updated: true }
          }
        }
        throw createError // Re-throw if it's a different error
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
  postalId: string,
  type: 'normal' | 'fast',
  price: number,
  priceWithoutTax: number,
  deliveryTime?: string,
  deliveryTimeAl?: string
): Promise<{ created: number; updated: number; notFound: number; errors: Array<{ city: string; error: string }> }> {
  const results = {
    created: 0,
    updated: 0,
    notFound: 0,
    errors: [] as Array<{ city: string; error: string }>
  }

  for (const cityName of cityNames) {
    // Find city and get actual name from database
    const cityInfo = await findCityByName(cityName)
    
    if (!cityInfo) {
      results.notFound++
      results.errors.push({ city: cityName, error: 'City not found in database' })
      continue
    }

    // Use the actual city name from the database to ensure exact match
    const actualCityName = cityInfo.name

    const result = await upsertPostalPricing(
      actualCityName, // Use actual name from database
      postalId,
      type,
      price,
      priceWithoutTax,
      deliveryTime,
      deliveryTimeAl
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
  try {
    console.log('🚀 Starting postal pricing population...\n')
    console.log(`Business ID: ${BUSINESS_ID}`)
    console.log(`Postal Services:`)
    console.log(`  - GED Normal (ID: ${POSTAL_SERVICE_IDS.normal})`)
    console.log(`  - GED Express (ID: ${POSTAL_SERVICE_IDS.express})\n`)

    // Verify postal services exist
    const normalPostal = await prisma.postal.findUnique({
      where: { id: POSTAL_SERVICE_IDS.normal }
    })

    const expressPostal = await prisma.postal.findUnique({
      where: { id: POSTAL_SERVICE_IDS.express }
    })

    if (!normalPostal || normalPostal.businessId !== BUSINESS_ID) {
      console.error(`❌ Postal service "GED Normal" not found or doesn't belong to business`)
      process.exit(1)
    }

    if (!expressPostal || expressPostal.businessId !== BUSINESS_ID) {
      console.error(`❌ Postal service "GED Express" not found or doesn't belong to business`)
      process.exit(1)
    }

    console.log('✅ Postal services verified\n')

    let totalCreated = 0
    let totalUpdated = 0
    let totalNotFound = 0
    const allErrors: Array<{ city: string; error: string }> = []

    // Albania - Tirana Districts (Normal)
    console.log(`📦 Processing Albania Tirana Districts - Normal (${TIRANA_DISTRICTS_CITY_NAMES.length} cities)...`)
    const batch1 = await processPricingBatch(
      TIRANA_DISTRICTS_CITY_NAMES,
      POSTAL_SERVICE_IDS.normal,
      'normal',
      PRICING_CONFIG.tiranaDistricts.normal.price,
      PRICING_CONFIG.tiranaDistricts.normal.priceWithoutTax,
      DELIVERY_TIMES.tiranaDistricts.normal,
      DELIVERY_TIMES.tiranaDistricts.normalAl
    )
    console.log(`   ✅ Created: ${batch1.created}, Updated: ${batch1.updated}, Not Found: ${batch1.notFound}, Errors: ${batch1.errors.length}\n`)
    totalCreated += batch1.created
    totalUpdated += batch1.updated
    totalNotFound += batch1.notFound
    allErrors.push(...batch1.errors)

    // Albania - Tirana Districts (Express)
    console.log(`📦 Processing Albania Tirana Districts - Express (${TIRANA_DISTRICTS_CITY_NAMES.length} cities)...`)
    const batch2 = await processPricingBatch(
      TIRANA_DISTRICTS_CITY_NAMES,
      POSTAL_SERVICE_IDS.express,
      'fast',
      PRICING_CONFIG.tiranaDistricts.express.price,
      PRICING_CONFIG.tiranaDistricts.express.priceWithoutTax,
      DELIVERY_TIMES.tiranaDistricts.express,
      DELIVERY_TIMES.tiranaDistricts.expressAl
    )
    console.log(`   ✅ Created: ${batch2.created}, Updated: ${batch2.updated}, Not Found: ${batch2.notFound}, Errors: ${batch2.errors.length}\n`)
    totalCreated += batch2.created
    totalUpdated += batch2.updated
    totalNotFound += batch2.notFound
    allErrors.push(...batch2.errors)

    // Albania - Other cities (Normal)
    console.log(`📦 Processing Albania Other Cities - Normal (${ALBANIA_OTHER_CITY_NAMES.length} cities)...`)
    const batch3 = await processPricingBatch(
      ALBANIA_OTHER_CITY_NAMES,
      POSTAL_SERVICE_IDS.normal,
      'normal',
      PRICING_CONFIG.albaniaOther.normal.price,
      PRICING_CONFIG.albaniaOther.normal.priceWithoutTax,
      DELIVERY_TIMES.albaniaOther.normal,
      DELIVERY_TIMES.albaniaOther.normalAl
    )
    console.log(`   ✅ Created: ${batch3.created}, Updated: ${batch3.updated}, Not Found: ${batch3.notFound}, Errors: ${batch3.errors.length}\n`)
    totalCreated += batch3.created
    totalUpdated += batch3.updated
    totalNotFound += batch3.notFound
    allErrors.push(...batch3.errors)

    // Albania - Other cities (Express)
    console.log(`📦 Processing Albania Other Cities - Express (${ALBANIA_OTHER_CITY_NAMES.length} cities)...`)
    const batch4 = await processPricingBatch(
      ALBANIA_OTHER_CITY_NAMES,
      POSTAL_SERVICE_IDS.express,
      'fast',
      PRICING_CONFIG.albaniaOther.express.price,
      PRICING_CONFIG.albaniaOther.express.priceWithoutTax,
      DELIVERY_TIMES.albaniaOther.express,
      DELIVERY_TIMES.albaniaOther.expressAl
    )
    console.log(`   ✅ Created: ${batch4.created}, Updated: ${batch4.updated}, Not Found: ${batch4.notFound}, Errors: ${batch4.errors.length}\n`)
    totalCreated += batch4.created
    totalUpdated += batch4.updated
    totalNotFound += batch4.notFound
    allErrors.push(...batch4.errors)

    // Kosovo (Normal)
    console.log(`📦 Processing Kosovo - Normal (${KOSOVO_CITY_NAMES.length} cities)...`)
    const batch5 = await processPricingBatch(
      KOSOVO_CITY_NAMES,
      POSTAL_SERVICE_IDS.normal,
      'normal',
      PRICING_CONFIG.kosovo.normal.price,
      PRICING_CONFIG.kosovo.normal.priceWithoutTax,
      DELIVERY_TIMES.kosovoMacedonia.normal,
      DELIVERY_TIMES.kosovoMacedonia.normalAl
    )
    console.log(`   ✅ Created: ${batch5.created}, Updated: ${batch5.updated}, Not Found: ${batch5.notFound}, Errors: ${batch5.errors.length}\n`)
    totalCreated += batch5.created
    totalUpdated += batch5.updated
    totalNotFound += batch5.notFound
    allErrors.push(...batch5.errors)

    // Kosovo (Express)
    console.log(`📦 Processing Kosovo - Express (${KOSOVO_CITY_NAMES.length} cities)...`)
    const batch6 = await processPricingBatch(
      KOSOVO_CITY_NAMES,
      POSTAL_SERVICE_IDS.express,
      'fast',
      PRICING_CONFIG.kosovo.express.price,
      PRICING_CONFIG.kosovo.express.priceWithoutTax,
      DELIVERY_TIMES.kosovoMacedonia.express,
      DELIVERY_TIMES.kosovoMacedonia.expressAl
    )
    console.log(`   ✅ Created: ${batch6.created}, Updated: ${batch6.updated}, Not Found: ${batch6.notFound}, Errors: ${batch6.errors.length}\n`)
    totalCreated += batch6.created
    totalUpdated += batch6.updated
    totalNotFound += batch6.notFound
    allErrors.push(...batch6.errors)

    // North Macedonia (Normal)
    console.log(`📦 Processing North Macedonia - Normal (${NORTH_MACEDONIA_CITY_NAMES.length} cities)...`)
    const batch7 = await processPricingBatch(
      NORTH_MACEDONIA_CITY_NAMES,
      POSTAL_SERVICE_IDS.normal,
      'normal',
      PRICING_CONFIG.macedonia.normal.price,
      PRICING_CONFIG.macedonia.normal.priceWithoutTax,
      DELIVERY_TIMES.kosovoMacedonia.normal,
      DELIVERY_TIMES.kosovoMacedonia.normalAl
    )
    console.log(`   ✅ Created: ${batch7.created}, Updated: ${batch7.updated}, Not Found: ${batch7.notFound}, Errors: ${batch7.errors.length}\n`)
    totalCreated += batch7.created
    totalUpdated += batch7.updated
    totalNotFound += batch7.notFound
    allErrors.push(...batch7.errors)

    // North Macedonia (Express)
    console.log(`📦 Processing North Macedonia - Express (${NORTH_MACEDONIA_CITY_NAMES.length} cities)...`)
    const batch8 = await processPricingBatch(
      NORTH_MACEDONIA_CITY_NAMES,
      POSTAL_SERVICE_IDS.express,
      'fast',
      PRICING_CONFIG.macedonia.express.price,
      PRICING_CONFIG.macedonia.express.priceWithoutTax,
      DELIVERY_TIMES.kosovoMacedonia.express,
      DELIVERY_TIMES.kosovoMacedonia.expressAl
    )
    console.log(`   ✅ Created: ${batch8.created}, Updated: ${batch8.updated}, Not Found: ${batch8.notFound}, Errors: ${batch8.errors.length}\n`)
    totalCreated += batch8.created
    totalUpdated += batch8.updated
    totalNotFound += batch8.notFound
    allErrors.push(...batch8.errors)

    // Final summary
    console.log('='.repeat(60))
    console.log('✅ Postal pricing population completed!\n')
    console.log('📊 Summary:')
    console.log(`   ✅ Created: ${totalCreated} records`)
    console.log(`   🔄 Updated: ${totalUpdated} records`)
    console.log(`   ⚠️  Not Found: ${totalNotFound} cities`)
    console.log(`   ❌ Errors: ${allErrors.length}\n`)

    if (allErrors.length > 0) {
      console.log('❌ Errors encountered:')
      allErrors.forEach(err => {
        console.log(`   - ${err.city}: ${err.error}`)
      })
      console.log('')
    }

    // Expected totals
    const expectedTotal = 
      (TIRANA_DISTRICTS_CITY_NAMES.length * 2) +
      (ALBANIA_OTHER_CITY_NAMES.length * 2) +
      (KOSOVO_CITY_NAMES.length * 2) +
      (NORTH_MACEDONIA_CITY_NAMES.length * 2)
    
    console.log(`📈 Expected total records: ${expectedTotal}`)
    console.log(`   - Albania Tirana Districts: ${TIRANA_DISTRICTS_CITY_NAMES.length} cities × 2 services = ${TIRANA_DISTRICTS_CITY_NAMES.length * 2}`)
    console.log(`   - Albania Other: ${ALBANIA_OTHER_CITY_NAMES.length} cities × 2 services = ${ALBANIA_OTHER_CITY_NAMES.length * 2}`)
    console.log(`   - Kosovo: ${KOSOVO_CITY_NAMES.length} cities × 2 services = ${KOSOVO_CITY_NAMES.length * 2}`)
    console.log(`   - North Macedonia: ${NORTH_MACEDONIA_CITY_NAMES.length} cities × 2 services = ${NORTH_MACEDONIA_CITY_NAMES.length * 2}\n`)

    console.log(`📋 Pricing Configuration:`)
    console.log(`   Albania Tirana Districts:`)
    console.log(`     - Normal: ${PRICING_CONFIG.tiranaDistricts.normal.price} ALL - ${DELIVERY_TIMES.tiranaDistricts.normal}`)
    console.log(`     - Express: ${PRICING_CONFIG.tiranaDistricts.express.price} ALL - ${DELIVERY_TIMES.tiranaDistricts.express}`)
    console.log(`   Albania Other Cities:`)
    console.log(`     - Normal: ${PRICING_CONFIG.albaniaOther.normal.price} ALL - ${DELIVERY_TIMES.albaniaOther.normal}`)
    console.log(`     - Express: ${PRICING_CONFIG.albaniaOther.express.price} ALL - ${DELIVERY_TIMES.albaniaOther.express}`)
    console.log(`   Kosovo:`)
    console.log(`     - Normal: ${PRICING_CONFIG.kosovo.normal.price} ALL - ${DELIVERY_TIMES.kosovoMacedonia.normal}`)
    console.log(`     - Express: ${PRICING_CONFIG.kosovo.express.price} ALL - ${DELIVERY_TIMES.kosovoMacedonia.express}`)
    console.log(`   North Macedonia:`)
    console.log(`     - Normal: ${PRICING_CONFIG.macedonia.normal.price} ALL - ${DELIVERY_TIMES.kosovoMacedonia.normal}`)
    console.log(`     - Express: ${PRICING_CONFIG.macedonia.express.price} ALL - ${DELIVERY_TIMES.kosovoMacedonia.express}\n`)

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
