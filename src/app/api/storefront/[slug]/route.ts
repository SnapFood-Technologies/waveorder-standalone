// app/api/storefront/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { trackBusinessView } from '@/lib/analytics'

const prisma = new PrismaClient()

function formatBusinessHours(businessHours: any): string | null {
  if (!businessHours) return null
  
  // Handle both array format (old) and object format (new)
  let hoursArray = businessHours
  if (!Array.isArray(businessHours) && typeof businessHours === 'object') {
    // Convert object format to array for processing
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    hoursArray = dayNames.map(day => ({
      day,
      open: businessHours[day]?.open || '09:00',
      close: businessHours[day]?.close || '17:00',
      closed: businessHours[day]?.closed || false
    }))
  }
  
  if (!Array.isArray(hoursArray)) return null
  
  const dayMap = {
    monday: 'Mo',
    tuesday: 'Tu', 
    wednesday: 'We',
    thursday: 'Th',
    friday: 'Fr',
    saturday: 'Sa',
    sunday: 'Su'
  }
  
  const openDays = hoursArray.filter(day => !day.closed)
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
  if (!businessHours) return true // Default open if no hours set
  
  // FIX: Get current time in business timezone
  const now = new Date()
  const businessTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const currentDay = dayNames[businessTime.getDay()] // Use businessTime, not now
  
  let todaysHours = null
  
  // Handle both array format (old) and object format (new)
  if (Array.isArray(businessHours)) {
    todaysHours = businessHours.find(day => day.day.toLowerCase() === currentDay)
  } else if (typeof businessHours === 'object') {
    todaysHours = businessHours[currentDay]
  }
  
  if (!todaysHours || todaysHours.closed) return false
  
  // FIX: Use business time, not server time
  const currentTime = `${businessTime.getHours().toString().padStart(2, '0')}:${businessTime.getMinutes().toString().padStart(2, '0')}`
  return currentTime >= todaysHours.open && currentTime <= todaysHours.close
}

function getNextOpenTime(businessHours: any, timezone: string): string | null {
  if (!businessHours) return null
  
  // FIX: Get current time in business timezone
  const now = new Date()
  const businessTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(businessTime) // Use businessTime, not now
    checkDate.setDate(checkDate.getDate() + i)
    const dayName = dayNames[checkDate.getDay()]
    
    let dayHours = null
    
    // Handle both array format (old) and object format (new)
    if (Array.isArray(businessHours)) {
      dayHours = businessHours.find(day => day.day.toLowerCase() === dayName)
    } else if (typeof businessHours === 'object') {
      dayHours = businessHours[dayName]
    }
    
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
                variants: {
                  orderBy: { price: 'asc' }
                },
                modifiers: {
                  orderBy: { price: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Track the view - call this after confirming business exists
    // Run in background, don't await to avoid slowing down the response
    trackBusinessView(business.id).catch(error => {
      console.error('Failed to track view:', error)
    })

    // Calculate business hours status
    const isOpen = calculateIsOpen(business.businessHours, business.timezone)
    const nextOpenTime = isOpen ? null : getNextOpenTime(business.businessHours, business.timezone)
    const openingHoursSchema = formatBusinessHours(business.businessHours)

    // Transform data for frontend (keep all your existing transformation logic)
    const storeData = {
      id: business.id,
      name: business.name,
      slug: business.slug,
      description: business.description,
      descriptionAl: business.descriptionAl, // ALBANIAN
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
      whatsappButtonColor: business.whatsappButtonColor,
      mobileCartStyle: business.mobileCartStyle,
      cartBadgeColor: business.cartBadgeColor,
      featuredBadgeColor: business.featuredBadgeColor,
      
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
      estimatedPickupTime: business.estimatedPickupTime,
      
      // Payment
      paymentMethods: business.paymentMethods,
      paymentInstructions: business.paymentInstructions,
      
      // WhatsApp
      greetingMessage: business.greetingMessage,
      orderNumberFormat: business.orderNumberFormat,
      
      // Store Closure Fields
      isTemporarilyClosed: business.isTemporarilyClosed || false,
      closureReason: business.closureReason,
      closureMessage: business.closureMessage,
      closureStartDate: business.closureStartDate?.toISOString(),
      closureEndDate: business.closureEndDate?.toISOString(),

      storeLatitude: business.storeLatitude,
      storeLongitude: business.storeLongitude,
      
      // SEO (English)
      seoTitle: business.seoTitle,
      seoDescription: business.seoDescription,
      seoKeywords: business.seoKeywords,
      ogImage: business.ogImage,
      canonicalUrl: business.canonicalUrl,
      schemaType: business.schemaType,
      schemaData: business.schemaData,
      favicon: business.favicon,
      noIndex: business.noIndex,
      
      // SEO (Albanian) - NEW
      seoTitleAl: business.seoTitleAl,
      seoDescriptionAl: business.seoDescriptionAl,
      seoKeywordsAl: business.seoKeywordsAl,
      
      // Business Hours
      businessHours: business.businessHours,
      isOpen: isOpen && !business.isTemporarilyClosed,
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
  } finally {
    await prisma.$disconnect()
  }
}