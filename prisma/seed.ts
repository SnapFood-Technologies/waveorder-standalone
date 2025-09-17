import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample business
  const business = await prisma.business.create({
    data: {
      name: "Pizza Palace",
      slug: "pizza-palace",
      description: "Authentic Italian pizza and pasta",
      whatsappNumber: "+1234567890",
      businessType: "RESTAURANT",
      currency: "USD",
      primaryColor: "#dc2626",
      secondaryColor: "#7f1d1d",
    }
  })

  // Create categories
  const pizzaCategory = await prisma.category.create({
    data: {
      name: "Pizza",
      businessId: business.id,
      sortOrder: 1
    }
  })

  const drinkCategory = await prisma.category.create({
    data: {
      name: "Drinks",
      businessId: business.id,
      sortOrder: 2
    }
  })

  // Create products
  await prisma.product.create({
    data: {
      name: "Margherita Pizza",
      description: "Fresh mozzarella, tomato sauce, basil",
      price: 14.99,
      categoryId: pizzaCategory.id,
      businessId: business.id,
      variants: {
        create: [
          { name: "Small", price: 12.99 },
          { name: "Medium", price: 14.99 },
          { name: "Large", price: 18.99 }
        ]
      },
      modifiers: {
        create: [
          { name: "Extra Cheese", price: 2.50 },
          { name: "Mushrooms", price: 1.50 },
          { name: "Pepperoni", price: 2.00 }
        ]
      }
    }
  })

  await prisma.product.create({
    data: {
      name: "Coca Cola",
      description: "Refreshing cola drink",
      price: 2.99,
      categoryId: drinkCategory.id,
      businessId: business.id,
      variants: {
        create: [
          { name: "Can 330ml", price: 2.99 },
          { name: "Bottle 500ml", price: 3.99 }
        ]
      }
    }
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
