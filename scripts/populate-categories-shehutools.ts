// scripts/populate-categories-shehutools.ts
// Populate categories and subcategories for Shehu Tools business

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Business ID for Shehu Tools
 */
const BUSINESS_ID = '698341988fc0915055a207ec'

/**
 * Category structure with English and Albanian names
 * Format: { name: English, nameAl: Albanian, children: [...] }
 */
const CATEGORIES = [
  {
    name: 'Electric & Battery Power Tools',
    nameAl: 'Vegla pune elektrike dhe me bateri',
    children: [
      { name: 'Combo Sets', nameAl: 'Sete combo' },
      { name: 'Screwdrivers', nameAl: 'Vidiator' },
      { name: 'Drills', nameAl: 'Trapan' },
      { name: 'Hammer Drills', nameAl: 'Matrapik' },
      { name: 'Angle Grinders', nameAl: 'Gurë fleksibel' },
      { name: 'Hand Routers', nameAl: 'Freza dore' },
      { name: 'Saws', nameAl: 'Sharra' },
      { name: 'Miter Saws', nameAl: 'Tronkantrice' },
      { name: 'Sanders & Polishers', nameAl: 'Zmeriluese, luciduese' },
      { name: 'Glue Mixers', nameAl: 'Përzierse kolle' },
      { name: 'Work Lights', nameAl: 'Ndricues' },
      { name: 'Air Heaters', nameAl: 'Ajerngrohëse' },
      { name: 'Planers', nameAl: 'Dadicekë' },
      { name: 'Other Devices', nameAl: 'Paisje te tjera' },
    ]
  },
  {
    name: 'Accessories for Various Machinery',
    nameAl: 'Aksesorë për makineri të ndryshme',
    children: [
      { name: 'Cutting & Adjusting Discs', nameAl: 'Disqe prerës dhe axhustues' },
      { name: 'Sandpaper & Abrasive Discs', nameAl: 'Leter zmerile dhe disqe abraziv' },
      { name: 'Punches', nameAl: 'Punto' },
      { name: 'Chisels', nameAl: 'Dalta' },
      { name: 'Grinding Cups', nameAl: 'Gota zmerilimi' },
      { name: 'Grinding Brushes', nameAl: 'Furca zmerilimi' },
      { name: 'Screwdriver Bits', nameAl: 'Maja vidash' },
      { name: 'Saw Blades', nameAl: 'Lama sharre' },
      { name: 'Other Accessories', nameAl: 'Aksesore te tjere' },
    ]
  },
  {
    name: 'Hand Tools & Construction Accessories',
    nameAl: 'Vegla dore dhe aksesorë ndërtimi',
    children: [
      { name: 'Cutting, Stripping & Precision Pliers', nameAl: 'Pinca prerese, zhveshese dhe precinimi' },
      { name: 'Hydraulic & Electric Pliers', nameAl: 'Pinca hidraulike dhe elektrike' },
      { name: 'Vises & Clamps', nameAl: 'Tronkeza dhe darë' },
      { name: 'Mechanical & Electric Screwdrivers', nameAl: 'Kacavida mekanike dhe elektrike' },
      { name: 'Wrenches & Jacks', nameAl: 'Celësa dhe kriketa' },
      { name: 'Hammers, Mallets & Levers', nameAl: 'Cekica, vare dhe leva' },
      { name: 'Scissors & Knives', nameAl: 'Gershërë dhe thika' },
      { name: 'Clamping Vises', nameAl: 'Morseta shtrëngimi' },
      { name: 'Silicone & Foam Guns', nameAl: 'Pistoletë silikoni dhe shkume' },
      { name: 'Metal, Wood & Drywall Saws', nameAl: 'Sharra hekuri, druri dhe gipsi' },
      { name: 'Tiling Tools', nameAl: 'Vegla pune për pllakashtrues' },
      { name: 'Tool Boxes & Bags', nameAl: 'Kuti veglash dhe canta' },
      { name: 'Drill, Flexible & Cleaning Brushes', nameAl: 'Furca trapani, fresibli dhe pastrimi' },
      { name: 'Files & Rasps', nameAl: 'Lima dhe zdrukthe' },
      { name: 'Nails & Construction Accessories', nameAl: 'Gozhdë dhe aksesorë ndertimi' },
    ]
  },
  {
    name: 'Gardening, Agriculture & Landscaping',
    nameAl: 'Kopshtaria, bujqësia dhe gjelbërimi',
    children: [
      { name: 'Brush Cutters & Accessories', nameAl: 'Motokosa dhe aksesorë' },
      { name: 'Lawn Mowers & Accessories', nameAl: 'Korrese bari dhe aksesorë' },
      { name: 'Milking Machines (Cow, Goat, Sheep)', nameAl: 'Mjelëse lope, dhie dhe dele' },
      { name: 'Pruners & Accessories', nameAl: 'Krasitëse dhe aksesorë' },
      { name: 'Leaf Blowers', nameAl: 'Fryrëse gjethesh' },
      { name: 'Chainsaws & Accessories', nameAl: 'Motosharra dhe aksesorë' },
      { name: 'Mechanical & Battery Sprayers', nameAl: 'Sperkatëse mekanike dhe me bateri' },
      { name: 'Olive Shakers', nameAl: 'Shkundëse ulliri' },
      { name: 'Hand Gardening Tools', nameAl: 'Mjete dore kopshtarie' },
      { name: 'Agricultural Tools', nameAl: 'Mjete bujqësore' },
      { name: 'Water Fittings & Adapters', nameAl: 'Rakorderi dhe adaptorë uji' },
      { name: 'Pruning Shears & Saws', nameAl: 'Gershërë dhe sharra krasitje' },
      { name: 'Irrigation & Accessories', nameAl: 'Vaditje dhe aksesorë' },
    ]
  },
  {
    name: 'Paints & Painting Supplies',
    nameAl: 'Bojra dhe artikuj per lyerje',
    children: [
      { name: 'Metal & Wood Paints', nameAl: 'Bojëra hekuri dhe druri' },
      { name: 'Wall & Acrylic Paints', nameAl: 'Bojëra muri, akrilik' },
      { name: 'Computer-Based Paints', nameAl: 'Bojëra me bazë kompjuteri' },
      { name: 'Plasmas & Painting Covers', nameAl: 'Plasmas dhe veshje për lyerje' },
      { name: 'Brushes, Rollers, Handles & Pens', nameAl: 'Furca, rula, bishta dhe penela' },
      { name: 'Paint Pigments', nameAl: 'Pigmente boje' },
      { name: 'Thinners, Solvents & Driers', nameAl: 'Diluent, tretes, tharës boje' },
      { name: 'Wood, Metal & Fiber Putty', nameAl: 'Stuko druri, hekuri dhe fiber' },
      { name: 'Patina Putty', nameAl: 'Stuko patinimi' },
      { name: 'Other Articles', nameAl: 'Artikuj te tjere' },
    ]
  },
  {
    name: 'Service Tools & Accessories',
    nameAl: 'Vegla dhe aksesorë për servis',
    children: [
      { name: 'Hydraulic Jacks', nameAl: 'Krik hidraulik' },
      { name: 'Jack Heads', nameAl: 'Koka kriketi' },
      { name: 'Heavy Service Tools', nameAl: 'Mjete servisi te rënda' },
      { name: 'Service Tools & Equipment', nameAl: 'Vegla dhe paisje servisi' },
    ]
  },
  {
    name: 'Construction & Welding Machinery',
    nameAl: 'Makineri ndërtimi dhe saldimi',
    children: [
      { name: 'Welding Machines', nameAl: 'Saldatrice' },
      { name: 'Heavy Construction Machinery', nameAl: 'Makineri ndertimi te rënda' },
      { name: 'Transport Equipment', nameAl: 'Mjete transporti' },
      { name: 'Welding Accessories', nameAl: 'Aksesorë saldimi' },
      { name: 'Safety Welding Clothing', nameAl: 'Veshje saldimi sigurie' },
    ]
  },
  {
    name: 'Pressure Washers & Vacuums',
    nameAl: 'Lavazhe dhe aspiratorë',
    children: [
      { name: 'Professional & Industrial Washers', nameAl: 'Lavazhe profesionale dhe industriale' },
      { name: 'Vacuums & Cleaners', nameAl: 'Aspiratorë dhe pastrues' },
      { name: 'Washer Accessories', nameAl: 'Aksesorë lavazhi' },
      { name: 'Other Accessories', nameAl: 'Aksesorë të tjerë' },
    ]
  },
  {
    name: 'Air Fittings, Compressors & Accessories',
    nameAl: 'Rakorderi ajri, kompresorë dhe aksesorë',
    children: [
      { name: 'Air Compressors', nameAl: 'Kompresorë ajrit' },
      { name: 'Air Guns', nameAl: 'Pistoleta me ajër' },
      { name: 'Air Fittings', nameAl: 'Rakorderi ajri' },
      { name: 'Various Accessories', nameAl: 'Aksesorë te ndryshëm' },
      { name: 'Nails & Tips', nameAl: 'Gozhdë dhe maja' },
    ]
  },
  {
    name: 'Hydraulics & Hydrants',
    nameAl: 'Hidraulike dhe hidrante',
    children: [
      { name: 'Supply', nameAl: 'Furnizimi' },
      { name: 'Drainage', nameAl: 'Shkarkimi' },
      { name: 'Supply Fittings', nameAl: 'Rakorderi furnizimi' },
      { name: 'Pressure Hydrant Fittings', nameAl: 'Rakorderi hidranti me presim' },
      { name: 'Copper Pipes & Fittings', nameAl: 'Tuba dhe rakorderi bakri' },
    ]
  },
  {
    name: 'Professional Electrical & Lighting',
    nameAl: 'Elektrike profesionale, ndricim',
    children: [
      { name: 'Bticino Classia', nameAl: 'Bticino classia' },
      { name: 'Gewiss', nameAl: 'Gewiss' },
      { name: 'Bticino Living', nameAl: 'Bticino living' },
      { name: 'Braytron Lighting', nameAl: 'Braytron ndricimi' },
      { name: 'Cables, Wires & Electric Tubes', nameAl: 'Kabëll, tel dhe tuba elektrike' },
      { name: 'Electrical Accessories & Equipment', nameAl: 'Aksesorë dhe paisje elektrike' },
    ]
  },
  {
    name: 'Water Pumps, Generators & Motor Pumps',
    nameAl: 'Pompa uji, gjeneratorë dhe motopompa',
    children: [
      { name: 'Water Pumps', nameAl: 'Pompa uji' },
      { name: 'Generators', nameAl: 'Gjeneratorë' },
      { name: 'Motors', nameAl: 'Motorra' },
      { name: 'Water Pump Accessories', nameAl: 'Aksesorë per pompa uji' },
      { name: 'Motor Pumps', nameAl: 'Motopompa' },
    ]
  },
  {
    name: 'Bolts, Fastening Systems & Accessories',
    nameAl: 'Bulloneri, sisteme fiksimi dhe aksesorë',
    children: [
      { name: 'Wood, Metal & Concrete Screws', nameAl: 'Vida druri, hekuri dhe betoni' },
      { name: 'Plastic & Metal Anchors', nameAl: 'Upa plastike dhe metalike' },
      { name: 'Bolts & Studs', nameAl: 'Bullona dhe prezhonierë' },
      { name: 'Stainless Steel Bolts & Screws', nameAl: 'Bullona dhe vida inoksi' },
      { name: 'Nuts & Washers', nameAl: 'Dado dhe rondele' },
      { name: 'Plastic & Metal Straps', nameAl: 'Fasheta plastike dhe metalike' },
      { name: 'Angles, Hinges & Hooks', nameAl: 'Kendore, mentesha dhe ganxha' },
      { name: 'Ropes & Chains', nameAl: 'Litar dhe zinxhir' },
      { name: 'Other Additional Accessories', nameAl: 'Aksesorë te tjerë shtesë' },
    ]
  },
  {
    name: 'Measuring Instruments',
    nameAl: 'Instrumenta matës',
    children: [
      { name: 'Hand Measuring Instruments', nameAl: 'Instrumenta matës dore' },
      { name: 'Electronic Measuring Instruments', nameAl: 'Instrumenta matës elektronik' },
      { name: 'Scales', nameAl: 'Peshore' },
      { name: 'Markers', nameAl: 'Shënjues' },
    ]
  },
  {
    name: 'Sprays, Silicone & Adhesives',
    nameAl: 'Sprajt, silikon dhe ngjitës adeziv',
    children: [
      { name: 'Sprays', nameAl: 'Spraj' },
      { name: 'Silicone', nameAl: 'Silikon' },
      { name: 'Glues', nameAl: 'Ngjitësa' },
      { name: 'Adhesive Glues', nameAl: 'Ngjitësa adezive' },
      { name: 'Pastes & Waterproofing', nameAl: 'Pasta dhe hidroizolues' },
      { name: 'Lubricants', nameAl: 'Lubrifikues' },
    ]
  },
  {
    name: 'Work Clothing & Safety Systems',
    nameAl: 'Veshje dhe sisteme sigurie në punë',
    children: [
      { name: 'Work Clothing', nameAl: 'Veshje pune' },
      { name: 'Work Shoes & Boots', nameAl: 'Kepucë pune dhe cizme' },
      { name: 'Safety Accessories & Equipment', nameAl: 'Aksesorë dhe paisje sigurie' },
      { name: 'Road Signage', nameAl: 'Sinjalistika rrugore' },
    ]
  },
  {
    name: 'Ladders & Scaffolding',
    nameAl: 'Shkallë dhe skela',
    children: [
      { name: 'Ladders', nameAl: 'Shkallë' },
      { name: 'Scaffolding & Accessories', nameAl: 'Skela dhe aksesorë' },
      { name: 'Moving & Static Wheels', nameAl: 'Rrota me levizje dhe statike' },
    ]
  },
  {
    name: 'Sanitary Ware & Accessories',
    nameAl: 'Hidrosanitare dhe aksesorë',
    children: [
      { name: 'Built-in Toilets', nameAl: 'Wc inkasio' },
      { name: 'Built-in Bidets', nameAl: 'Bide inkasio' },
      { name: 'Built-in Sinks', nameAl: 'Lavaman inkasio' },
      { name: 'Stainless & Simple Sinks', nameAl: 'Lavaman inoksi dhe te thjeshtë' },
      { name: 'Sinks & Bathtubs', nameAl: 'Lavaman dhe bango' },
      { name: 'Faucets', nameAl: 'Rubinetari' },
      { name: 'Toilet Accessories', nameAl: 'Aksesorë tualeti' },
      { name: 'Fittings & Basins', nameAl: 'Rakorderi dhe pileta' },
    ]
  },
  {
    name: 'Home Appliances & Accessories',
    nameAl: 'Paisje shtepiake dhe aksesorë',
    children: [
      { name: 'Air Conditioners', nameAl: 'Kondicionerë' },
      { name: 'Heating & Cooling', nameAl: 'Ngrohja dhe ftohja' },
      { name: 'Cleaning', nameAl: 'Pastrimi' },
      { name: 'Security', nameAl: 'Siguria' },
      { name: 'Grills', nameAl: 'Zgara' },
      { name: 'Outdoor', nameAl: 'Oborri' },
    ]
  },
  {
    name: 'Spare Parts',
    nameAl: 'Pjesë këmbimi',
    children: [
      { name: 'Power Tool Parts', nameAl: 'Pjesë për vegla pune' },
      { name: 'Agricultural Tool Parts', nameAl: 'Pjesë për vegla bujqësore' },
      { name: 'Bearings', nameAl: 'Guzhineta' },
      { name: 'Spark Plugs', nameAl: 'Kandele' },
      { name: 'Machinery & Washer Parts', nameAl: 'Pjesë për makineri, lavazhe' },
      { name: 'Various Parts', nameAl: 'Pjesë të ndryshme' },
    ]
  },
  {
    name: 'Miscellaneous',
    nameAl: 'Të ndryshme',
    children: [
      { name: 'Various Accessories', nameAl: 'Aksesorë të ndryshëm' },
    ]
  },
]

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting category population for Shehu Tools...\n')
    console.log(`Business ID: ${BUSINESS_ID}\n`)

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: BUSINESS_ID },
      select: { id: true, name: true, slug: true }
    })

    if (!business) {
      console.error(`❌ Business not found with ID: ${BUSINESS_ID}`)
      process.exit(1)
    }

    console.log(`✅ Found business: ${business.name} (${business.slug})\n`)

    // Check existing categories
    const existingCategories = await prisma.category.count({
      where: { businessId: BUSINESS_ID }
    })

    if (existingCategories > 0) {
      console.log(`⚠️  Business already has ${existingCategories} categories.`)
      console.log(`   Do you want to continue? This will add new categories.\n`)
      // In a real script, you might want to prompt for confirmation
    }

    let parentSortOrder = 0
    let totalParents = 0
    let totalChildren = 0

    for (const category of CATEGORIES) {
      parentSortOrder++

      // Check if parent category already exists
      const existingParent = await prisma.category.findFirst({
        where: {
          businessId: BUSINESS_ID,
          name: category.name,
          parentId: null
        }
      })

      let parentId: string

      if (existingParent) {
        console.log(`⏭️  Parent exists: ${category.name}`)
        parentId = existingParent.id
      } else {
        // Create parent category
        const parent = await prisma.category.create({
          data: {
            name: category.name,
            nameAl: category.nameAl,
            businessId: BUSINESS_ID,
            parentId: null,
            sortOrder: parentSortOrder,
            isActive: true
          }
        })
        parentId = parent.id
        totalParents++
        console.log(`✅ Created parent: ${category.name}`)
      }

      // Create children
      let childSortOrder = 0
      for (const child of category.children) {
        childSortOrder++

        // Check if child already exists
        const existingChild = await prisma.category.findFirst({
          where: {
            businessId: BUSINESS_ID,
            name: child.name,
            parentId: parentId
          }
        })

        if (existingChild) {
          console.log(`   ⏭️  Child exists: ${child.name}`)
          continue
        }

        await prisma.category.create({
          data: {
            name: child.name,
            nameAl: child.nameAl,
            businessId: BUSINESS_ID,
            parentId: parentId,
            sortOrder: childSortOrder,
            isActive: true
          }
        })
        totalChildren++
        console.log(`   ✅ Created child: ${child.name}`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Category population completed!\n')
    console.log('📊 Summary:')
    console.log(`   ✅ Parent categories created: ${totalParents}`)
    console.log(`   ✅ Child categories created: ${totalChildren}`)
    console.log(`   📦 Total categories created: ${totalParents + totalChildren}\n`)

    // Final count
    const finalCount = await prisma.category.count({
      where: { businessId: BUSINESS_ID }
    })
    console.log(`📈 Total categories for business: ${finalCount}`)

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
