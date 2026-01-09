import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Location data structure
 */
interface LocationData {
  countryCode: string
  countryName: string
  countryGeonameId: number
  states: Array<{
    name: string
    code: string
    geonameId: number
    cities: Array<{
      name: string
      geonameId: number
    }>
  }>
}

// Kosovo data
const KOSOVO_DATA: LocationData = {
  countryCode: 'XK',
  countryName: 'Kosovo',
  countryGeonameId: 831053,
  states: [
    {
      name: 'Kosovo',
      code: 'XK',
      geonameId: 831053,
      cities: [
        { name: 'Deçan', geonameId: 783495 },
        { name: 'Dragash', geonameId: 783130 },
        { name: 'Drenas', geonameId: 783127 },
        { name: 'Ferizaj', geonameId: 783096 },
        { name: 'Fushë-Kosovë', geonameId: 783127 },
        { name: 'Gjakova', geonameId: 789228 },
        { name: 'Gjilan', geonameId: 790674 },
        { name: 'Gllogoc', geonameId: 790674 },
        { name: 'Graçanicë', geonameId: 790674 },
        { name: 'Hani i Elezit', geonameId: 790674 },
        { name: 'Istog', geonameId: 789995 },
        { name: 'Junik', geonameId: 789228 },
        { name: 'Kaçanik', geonameId: 789228 },
        { name: 'Kamenica', geonameId: 790674 },
        { name: 'Klinë', geonameId: 789228 },
        { name: 'Kllokot', geonameId: 790674 },
        { name: 'Leposaviq', geonameId: 788726 },
        { name: 'Lipjan', geonameId: 788726 },
        { name: 'Malishevë', geonameId: 789228 },
        { name: 'Mamushë', geonameId: 789228 },
        { name: 'Novobërdë', geonameId: 790674 },
        { name: 'Obiliq', geonameId: 787157 },
        { name: 'Partesh', geonameId: 790674 },
        { name: 'Peje', geonameId: 789228 },
        { name: 'Podujevë', geonameId: 786950 },
        { name: 'Prishtinë', geonameId: 786714 },
        { name: 'Prizren', geonameId: 786712 },
        { name: 'Rahovec', geonameId: 789228 },
        { name: 'Ranillug', geonameId: 790674 },
        { name: 'Shtërpcë', geonameId: 789228 },
        { name: 'Shtime', geonameId: 786714 },
        { name: 'Skenderaj', geonameId: 785238 },
        { name: 'Suhareka', geonameId: 785238 },
        { name: 'Vitia', geonameId: 790674 },
        { name: 'Vushtrri', geonameId: 784759 },
        { name: 'Zubin Potok', geonameId: 788726 },
        { name: 'Zveçan', geonameId: 788726 }
      ]
    }
  ]
}

// North Macedonia data
const NORTH_MACEDONIA_DATA: LocationData = {
  countryCode: 'MK',
  countryName: 'North Macedonia',
  countryGeonameId: 718075,
  states: [
    {
      name: 'North Macedonia',
      code: 'MK',
      geonameId: 718075,
      cities: [
        { name: 'Berovo', geonameId: 792658 },
        { name: 'Bitola', geonameId: 792578 },
        { name: 'Bogdanci', geonameId: 792555 },
        { name: 'Debar', geonameId: 793160 },
        { name: 'Delčevo', geonameId: 791606 },
        { name: 'Demir Hisar', geonameId: 791606 },
        { name: 'Demir Kapija', geonameId: 791606 },
        { name: 'Gevgelija', geonameId: 790571 },
        { name: 'Gostivar', geonameId: 790295 },
        { name: 'Kavadarci', geonameId: 789527 },
        { name: 'Kičevo', geonameId: 789527 },
        { name: 'Kočani', geonameId: 789380 },
        { name: 'Kratovo', geonameId: 789045 },
        { name: 'Kriva Palanka', geonameId: 789045 },
        { name: 'Kruševo', geonameId: 789045 },
        { name: 'Kumanova', geonameId: 788886 },
        { name: 'Makedonska Kamenica', geonameId: 788886 },
        { name: 'Makedonski Brod', geonameId: 788886 },
        { name: 'Negotino', geonameId: 787715 },
        { name: 'Ohrid', geonameId: 787487 },
        { name: 'Pehčevo', geonameId: 787487 },
        { name: 'Prilep', geonameId: 786735 },
        { name: 'Probištip', geonameId: 786735 },
        { name: 'Radoviš', geonameId: 786735 },
        { name: 'Resen', geonameId: 786735 },
        { name: 'Skopje', geonameId: 785842 },
        { name: 'Štip', geonameId: 785480 },
        { name: 'Struga', geonameId: 785480 },
        { name: 'Strumica', geonameId: 785480 },
        { name: 'Sveti Nikole', geonameId: 785480 },
        { name: 'Tetovo', geonameId: 785082 },
        { name: 'Valandovo', geonameId: 784884 },
        { name: 'Veles', geonameId: 784884 },
        { name: 'Vinica', geonameId: 784884 }
      ]
    }
  ]
}

// Albania data - from the JSON provided
const ALBANIA_DATA: LocationData = {
  countryCode: 'AL',
  countryName: 'Albania',
  countryGeonameId: 783754, // Albania's geonameId
  states: [
    {
      name: 'Berat',
      code: '40',
      geonameId: 865730,
      cities: [
        { name: 'Berat', geonameId: 10944368 },
        { name: 'Kuçovë', geonameId: 10944369 },
        { name: 'Poliçan', geonameId: 10944370 },
        { name: 'Skrapar', geonameId: 10944371 },
        { name: 'Ura Vajgurore', geonameId: 10944372 }
      ]
    },
    {
      name: 'Dibër',
      code: '41',
      geonameId: 865731,
      cities: [
        { name: 'Bulqizë', geonameId: 10944373 },
        { name: 'Dibër', geonameId: 10944374 },
        { name: 'Klos', geonameId: 10944375 },
        { name: 'Mat', geonameId: 10944376 }
      ]
    },
    {
      name: 'Durrës',
      code: '42',
      geonameId: 3344947,
      cities: [
        { name: 'Durrës', geonameId: 10944377 },
        { name: 'Krujë', geonameId: 10944378 },
        { name: 'Shijak', geonameId: 10944379 }
      ]
    },
    {
      name: 'Elbasan',
      code: '43',
      geonameId: 865732,
      cities: [
        { name: 'Belsh', geonameId: 10944381 },
        { name: 'Cërrik', geonameId: 10944382 },
        { name: 'Elbasan', geonameId: 10944380 },
        { name: 'Gramsh', geonameId: 10944383 },
        { name: 'Librazhd', geonameId: 10944384 },
        { name: 'Peqin', geonameId: 10944385 },
        { name: 'Prrenjas', geonameId: 10944386 }
      ]
    },
    {
      name: 'Fier',
      code: '44',
      geonameId: 3344948,
      cities: [
        { name: 'Divjakë', geonameId: 10944387 },
        { name: 'Fier', geonameId: 10944388 },
        { name: 'Lushnje', geonameId: 10944389 },
        { name: 'Mallakastër', geonameId: 10944390 },
        { name: 'Patos', geonameId: 10944391 },
        { name: 'Roskovec', geonameId: 10944392 }
      ]
    },
    {
      name: 'Gjirokastër',
      code: '45',
      geonameId: 865733,
      cities: [
        { name: 'Dropull', geonameId: 10944393 },
        { name: 'Gjirokastër', geonameId: 10944394 },
        { name: 'Kelcyrë', geonameId: 10944395 },
        { name: 'Libohovë', geonameId: 10944396 },
        { name: 'Memaliaj', geonameId: 10944397 },
        { name: 'Përmet', geonameId: 10944398 },
        { name: 'Tepelenë', geonameId: 10944399 }
      ]
    },
    {
      name: 'Korçë',
      code: '46',
      geonameId: 865734,
      cities: [
        { name: 'Devoll', geonameId: 10944400 },
        { name: 'Kolonjë', geonameId: 10944401 },
        { name: 'Korçë', geonameId: 10944402 },
        { name: 'Maliq', geonameId: 10944403 },
        { name: 'Pogradec', geonameId: 10944404 },
        { name: 'Pustec', geonameId: 10944405 }
      ]
    },
    {
      name: 'Kukës',
      code: '47',
      geonameId: 865735,
      cities: [
        { name: 'Has', geonameId: 10944406 },
        { name: 'Kukës', geonameId: 10944407 },
        { name: 'Tropojë', geonameId: 10944408 }
      ]
    },
    {
      name: 'Lezhë',
      code: '48',
      geonameId: 3344949,
      cities: [
        { name: 'Kurbin', geonameId: 10944409 },
        { name: 'Lezhë', geonameId: 10944410 },
        { name: 'Mirditë', geonameId: 10944411 }
      ]
    },
    {
      name: 'Shkodër',
      code: '49',
      geonameId: 3344950,
      cities: [
        { name: 'Fushë Arrës', geonameId: 10944412 },
        { name: 'Malësi e Madhe', geonameId: 10944413 },
        { name: 'Pukë', geonameId: 10944414 },
        { name: 'Shkodër', geonameId: 10944415 },
        { name: 'Vau i Dejës', geonameId: 10944416 }
      ]
    },
    {
      name: 'Tirana',
      code: '50',
      geonameId: 3344951,
      cities: [
        { name: 'Kamëz', geonameId: 10944417 },
        { name: 'Kavajë', geonameId: 10944418 },
        { name: 'Rrogozhinë', geonameId: 10944419 },
        { name: 'Tiranë', geonameId: 10944420 },
        { name: 'Vorë', geonameId: 10944421 }
      ]
    },
    {
      name: 'Vlorë',
      code: '51',
      geonameId: 3344952,
      cities: [
        { name: 'Delvinë', geonameId: 10944422 },
        { name: 'Finiq', geonameId: 10944423 },
        { name: 'Himarë', geonameId: 10944424 },
        { name: 'Konispol', geonameId: 10944425 },
        { name: 'Sarandë', geonameId: 10944426 },
        { name: 'Selenicë', geonameId: 10944427 },
        { name: 'Vlorë', geonameId: 10944428 }
      ]
    }
  ]
}

/**
 * Populate locations for a country
 */
async function populateLocations(data: LocationData) {
  try {
    console.log(`\n🌍 Processing ${data.countryName} (${data.countryCode})...\n`)

    // Step 1: Find or create country
    let country = await prisma.country.findUnique({
      where: { code: data.countryCode }
    })

    if (!country) {
      country = await prisma.country.create({
        data: {
          name: data.countryName,
          code: data.countryCode,
          geonameId: data.countryGeonameId
        }
      })
      console.log(`✅ Created country: ${country.name} (${country.code}) - ID: ${country.id}`)
    } else {
      console.log(`ℹ️  Country already exists: ${country.name} (${country.code}) - ID: ${country.id}`)
    }

    const countryId = country.id
    let totalStatesCreated = 0
    let totalStatesSkipped = 0
    let totalCitiesCreated = 0
    let totalCitiesSkipped = 0

    // Step 2: Process states and cities
    for (const stateData of data.states) {
      console.log(`\n📋 Processing state: ${stateData.name} (${stateData.code})`)

      // Check if state already exists
      let state = await prisma.state.findFirst({
        where: {
          countryId: countryId,
          code: stateData.code
        }
      })

      if (!state) {
        // Try by name if code doesn't match
        state = await prisma.state.findFirst({
          where: {
            countryId: countryId,
            name: { equals: stateData.name, mode: 'insensitive' }
          }
        })
      }

      let stateId: string
      if (state) {
        stateId = state.id
        console.log(`  ℹ️  State already exists: ${stateData.name} - ID: ${stateId}`)
        totalStatesSkipped++
      } else {
        // Create state
        const newState = await prisma.state.create({
          data: {
            name: stateData.name,
            code: stateData.code,
            countryId: countryId,
            geonameId: stateData.geonameId
          }
        })
        stateId = newState.id
        console.log(`  ✅ Created state: ${stateData.name} - ID: ${stateId}`)
        totalStatesCreated++
      }

      // Step 3: Create cities for this state
      console.log(`  📋 Processing ${stateData.cities.length} cities...`)
      let citiesCreated = 0
      let citiesSkipped = 0

      for (const cityData of stateData.cities) {
        // Check if city already exists
        const existingCity = await prisma.city.findFirst({
          where: {
            stateId: stateId,
            name: { equals: cityData.name, mode: 'insensitive' }
          }
        })

        if (existingCity) {
          console.log(`    ℹ️  City already exists: ${cityData.name}`)
          citiesSkipped++
          continue
        }

        // Create city
        await prisma.city.create({
          data: {
            name: cityData.name,
            stateId: stateId,
            geonameId: cityData.geonameId
          }
        })
        console.log(`    ✅ Created city: ${cityData.name}`)
        citiesCreated++
      }

      totalCitiesCreated += citiesCreated
      totalCitiesSkipped += citiesSkipped
      console.log(`  📊 State summary: ${citiesCreated} created, ${citiesSkipped} skipped`)
    }

    // Final summary
    console.log('\n' + '='.repeat(50))
    console.log(`✅ ${data.countryName} population complete!`)
    console.log('='.repeat(50))
    console.log(`\nSummary:`)
    console.log(`- Country: ${data.countryName} (${data.countryCode})`)
    console.log(`- States: ${totalStatesCreated} created, ${totalStatesSkipped} skipped`)
    console.log(`- Cities: ${totalCitiesCreated} created, ${totalCitiesSkipped} skipped`)
    console.log(`- Total states: ${data.states.length}`)
    console.log(`- Total cities: ${data.states.reduce((sum, s) => sum + s.cities.length, 0)}`)

  } catch (error) {
    console.error(`❌ Error populating ${data.countryName}:`, error)
    throw error
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const locationType = args[0]?.toLowerCase()

  try {
    if (!locationType || locationType === 'all') {
      // Populate all countries
      console.log('🌍 Populating all locations (Kosovo, North Macedonia, Albania)...\n')
      await populateLocations(KOSOVO_DATA)
      await populateLocations(NORTH_MACEDONIA_DATA)
      await populateLocations(ALBANIA_DATA)
    } else if (locationType === 'kosovo' || locationType === 'xk') {
      await populateLocations(KOSOVO_DATA)
    } else if (locationType === 'north-macedonia' || locationType === 'macedonia' || locationType === 'mk') {
      await populateLocations(NORTH_MACEDONIA_DATA)
    } else if (locationType === 'albania' || locationType === 'al') {
      await populateLocations(ALBANIA_DATA)
    } else {
      console.error(`❌ Unknown location type: ${locationType}`)
      console.error(`   Usage: npx tsx scripts/populate-locations.ts [kosovo|north-macedonia|albania|all]`)
      process.exit(1)
    }

    console.log('\n✅ Script completed successfully')
  } catch (error) {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main()
