// app/api/storefront/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function formatBusinessHours(businessHours: any): string | null {
  if (!businessHours || !Array.isArray(businessHours)) return null
  
  const dayMap = {
    monday: 'Mo',
    tuesday: 'Tu', 
    wednesday: 'We',
    thursday: 'Th',
    friday: 'Fr',
    saturday: 'Sa',
    sunday: 'Su'
  }
  
  const openDays = businessHours.filter(day => !day.closed)
  if (openDays.length === 0) return null
  
  // Group consecutive days with same hours
  const groups = []
  let currentGroup = null
  
  for (const day of openDays) {
    // @ts-ignore
    const dayCode = dayMap[day.day.toLowerCase()]
    const hours = `${day.open}-${day.close}`
    
    if (!currentGroup || currentGroup.hours !== hours) {
      currentGroup = { start: dayCode, end: dayCode, hours }
      groups.push(currentGroup)
    } else {
      currentGroup.end = dayCode
    }
  }
  
  return groups.map(group => {
    const dayRange = group.start === group.end ? group.start : `${group.start}-${group.end}`
    return `${dayRange} ${group.hours}`
  }).join(', ')
}

function calculateIsOpen(businessHours: any, timezone: string): boolean {
  if (!businessHours || !Array.isArray(businessHours)) return true // Default open if no hours set
  
  const now = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const currentDay = dayNames[now.getDay()]
  
  const todaysHours = businessHours.find(day => day.day.toLowerCase() === currentDay)
  if (!todaysHours || todaysHours.closed) return false
  
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
  return currentTime >= todaysHours.open && currentTime <= todaysHours.close
}

function getNextOpenTime(businessHours: any, timezone: string): string | null {
  if (!businessHours || !Array.isArray(businessHours)) return null
  
  const now = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() + i)
    const dayName = dayNames[checkDate.getDay()]
    
    const dayHours = businessHours.find(day => day.day.toLowerCase() === dayName)
    if (dayHours && !dayHours.closed) {
      return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} at ${dayHours.open}`
    }
  }
  
  return null
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params

    // Find business by slug
    const business = await prisma.business.findUnique({
      where: { 
        slug,
        isActive: true,
        setupWizardCompleted: true
      },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            products: {
              where: { isActive: true },
              include: {
                variants: true,
                modifiers: true
              }
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Check if indexable
    if (!business.isIndexable && business.noIndex) {
      return NextResponse.json({ error: 'Store not available' }, { status: 404 })
    }

    // Calculate business hours status
    // @ts-ignore
    const isOpen = calculateIsOpen(business.businessHours, business.timezone)
    // @ts-ignore
    const nextOpenTime = isOpen ? null : getNextOpenTime(business.businessHours, business.timezone)
    // @ts-ignore
    const openingHoursSchema = formatBusinessHours(business.businessHours)

    // Transform data for frontend
    const storeData = {
      id: business.id,
      name: business.name,
      slug: business.slug,
      description: business.description,
      logo: business.logo,
      coverImage: business.coverImage,
      phone: business.phone,
      email: business.email,
      address: business.address,
      website: business.website,
      whatsappNumber: business.whatsappNumber,
      businessType: business.businessType,
      
      // Branding
      primaryColor: business.primaryColor,
      secondaryColor: business.secondaryColor,
      fontFamily: business.fontFamily,
      
      // Settings
      currency: business.currency,
      timezone: business.timezone,
      language: business.language,
      deliveryFee: business.deliveryFee,
      minimumOrder: business.minimumOrder,
      deliveryRadius: business.deliveryRadius,
      
      // Delivery options
      deliveryEnabled: business.deliveryEnabled,
      pickupEnabled: business.pickupEnabled,
      dineInEnabled: business.dineInEnabled,
      estimatedDeliveryTime: business.estimatedDeliveryTime,
      
      // Payment
      paymentMethods: business.paymentMethods,
      paymentInstructions: business.paymentInstructions,
      
      // WhatsApp
      greetingMessage: business.greetingMessage,
      orderNumberFormat: business.orderNumberFormat,
      
      // SEO
      seoTitle: business.seoTitle,
      seoDescription: business.seoDescription,
      seoKeywords: business.seoKeywords,
      ogImage: business.ogImage,
      canonicalUrl: business.canonicalUrl,
      schemaType: business.schemaType,
      schemaData: business.schemaData,
      favicon: business.favicon,
      noIndex: business.noIndex,
      
      // Business Hours
      // @ts-ignore
      businessHours: business.businessHours,
      isOpen,
      nextOpenTime,
      openingHoursSchema,
      
      // Menu
      categories: business.categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        image: category.image,
        sortOrder: category.sortOrder,
        products: category.products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          price: product.price,
          originalPrice: product.originalPrice,
          sku: product.sku,
          stock: product.stock,
          featured: product.featured,
          metaTitle: product.metaTitle,
          metaDescription: product.metaDescription,
          variants: product.variants.map(variant => ({
            id: variant.id,
            name: variant.name,
            price: variant.price,
            stock: variant.stock,
            sku: variant.sku
          })),
          modifiers: product.modifiers.map(modifier => ({
            id: modifier.id,
            name: modifier.name,
            price: modifier.price,
            required: modifier.required
          }))
        }))
      }))
    }

    return NextResponse.json(storeData)

  } catch (error) {
    console.error('Storefront API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}