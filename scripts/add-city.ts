// scripts/add-city.ts
// Script to add a specific city to an existing state
// Usage: npx tsx scripts/add-city.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CityToAdd {
  name: string
  geonameId: number
  stateName: string
  countryCode: string
}

// Cities to add
const CITIES_TO_ADD: CityToAdd[] = [
  {
    name: 'Dafni',
    geonameId: 263219, // Dafni, Attica geoname ID
    stateName: 'Attica',
    countryCode: 'GR'
  }
]

async function addCities() {
  console.log('🏙️ Adding cities...\n')

  for (const cityData of CITIES_TO_ADD) {
    try {
      // Find the country
      const country = await prisma.country.findFirst({
        where: { code: cityData.countryCode }
      })

      if (!country) {
        console.log(`❌ Country ${cityData.countryCode} not found. Skipping ${cityData.name}.`)
        continue
      }

      // Find the state
      const state = await prisma.state.findFirst({
        where: {
          name: cityData.stateName,
          countryId: country.id
        }
      })

      if (!state) {
        console.log(`❌ State ${cityData.stateName} not found in ${cityData.countryCode}. Skipping ${cityData.name}.`)
        continue
      }

      // Check if city already exists
      const existingCity = await prisma.city.findFirst({
        where: {
          name: cityData.name,
          stateId: state.id
        }
      })

      if (existingCity) {
        console.log(`⏭️ City ${cityData.name} already exists in ${cityData.stateName}, ${cityData.countryCode}`)
        continue
      }

      // Add the city
      const newCity = await prisma.city.create({
        data: {
          name: cityData.name,
          geonameId: cityData.geonameId,
          stateId: state.id
        }
      })

      console.log(`✅ Added: ${cityData.name} to ${cityData.stateName}, ${cityData.countryCode} (ID: ${newCity.id})`)

    } catch (error) {
      console.error(`❌ Error adding ${cityData.name}:`, error)
    }
  }

  console.log('\n✨ Done!')
}

addCities()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
