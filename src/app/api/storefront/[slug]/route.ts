// app/api/storefront/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { trackBusinessView } from '@/lib/analytics'
import * as Sentry from '@sentry/nextjs'

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
  let slug: string = 'unknown'
  
  try {
    slug = (await context.params).slug

    // Set Sentry context for this request
    Sentry.setContext('storefront_request', {
      endpoint: '/api/storefront/[slug]',
      method: 'GET',
      slug,
    })
    Sentry.setTag('api_type', 'storefront')
    Sentry.setTag('method', 'GET')

    // Validate slug - reject file extensions and suspicious patterns (bot/scanner protection)
    const invalidPatterns = /\.(php|asp|aspx|jsp|cgi|xml|txt|html|htm|js|css|json|sql|sh|py|rb|pl)$/i
    if (invalidPatterns.test(slug) || slug.length > 100 || slug.length < 1) {
      Sentry.setTag('error_type', 'invalid_slug')
      Sentry.setTag('status_code', '404')
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

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
            // @ts-ignore - Parent relation will exist after Prisma client regeneration
            parent: {
              select: {
                id: true,
                name: true,
                nameAl: true,
                hideParentInStorefront: true
              }
            },
            // @ts-ignore - Children relation will exist after Prisma client regeneration
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                name: true,
                nameAl: true,
                description: true,
                descriptionAl: true,
                image: true,
                sortOrder: true
              }
            },
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
    }) as any

    if (!business) {
      Sentry.setTag('error_type', 'store_not_found')
      Sentry.setTag('status_code', '404')
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Set business context for Sentry
    Sentry.setTag('business_id', business.id)
    Sentry.setTag('business_type', business.businessType)

    // Track the view - call this after confirming business exists
    // Run in background, don't await to avoid slowing down the response
    trackBusinessView(business.id).catch(error => {
      Sentry.captureException(error, {
        tags: {
          operation: 'track_business_view',
          businessId: business.id,
        },
        extra: {
          slug,
        },
      })
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
      storefrontLanguage: business.storefrontLanguage || business.language || 'en', // Defaults to business language
      timeFormat: business.timeFormat || '24', // Default to 24-hour format
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
      categories: (() => {
        // Get storefront language (default to business language or 'en')
        const storefrontLanguage = business.storefrontLanguage || business.language || 'en'
        const useAlbanian = storefrontLanguage === 'al' || storefrontLanguage === 'sq'
        
        // Build all categories with products
        const allCategories = (business.categories as any[]).map((category: any) => ({
          id: category.id,
          name: useAlbanian && category.nameAl ? category.nameAl : category.name,
          description: useAlbanian && category.descriptionAl ? category.descriptionAl : category.description,
          nameAl: category.nameAl,
          descriptionAl: category.descriptionAl,
          parentId: category.parentId,
          parent: category.parent ? {
            id: category.parent.id,
            name: useAlbanian && category.parent.nameAl ? category.parent.nameAl : category.parent.name,
            hideParentInStorefront: category.parent.hideParentInStorefront
          } : null,
          hideParentInStorefront: category.hideParentInStorefront,
          image: category.image,
          sortOrder: category.sortOrder,
          children: category.children ? (category.children as any[]).map((child: any) => ({
            id: child.id,
            name: useAlbanian && child.nameAl ? child.nameAl : child.name,
            description: useAlbanian && child.descriptionAl ? child.descriptionAl : child.description,
            nameAl: child.nameAl,
            descriptionAl: child.descriptionAl,
            image: child.image,
            sortOrder: child.sortOrder
          })) : [],
          products: (category.products as any[]).map((product: any) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            images: product.images,
            price: product.price,
            originalPrice: product.originalPrice,
            sku: product.sku,
            stock: product.stock,
            trackInventory: product.trackInventory,
            featured: product.featured,
            metaTitle: product.metaTitle,
            metaDescription: product.metaDescription,
            variants: (product.variants as any[]).map((variant: any) => ({
              id: variant.id,
              name: variant.name,
              price: variant.price,
              stock: variant.stock,
              sku: variant.sku
            })),
            modifiers: (product.modifiers as any[]).map((modifier: any) => ({
              id: modifier.id,
              name: modifier.name,
              price: modifier.price,
              required: modifier.required
            }))
          }))
        }))
        
        // Separate parent and child categories
        const parentCategories = allCategories.filter((cat: any) => !cat.parentId)
        const childCategories = allCategories.filter((cat: any) => cat.parentId)
        
        // Check if we should hide single parent
        if (parentCategories.length === 1 && parentCategories[0].hideParentInStorefront) {
          // Return only children of that parent in flat structure
          // Need to get products from parent category that belong to these children
          const parentId = parentCategories[0].id
          return childCategories
            .filter((child: any) => child.parentId === parentId)
            .map((child: any) => {
              // Find the child category in allCategories to get its products
              const childWithProducts = allCategories.find((c: any) => c.id === child.id)
              return {
                ...child,
                products: childWithProducts?.products || []
              }
            })
            .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        }
        
        // Return parent categories with their children nested
        return parentCategories.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      })()
    }

    return NextResponse.json(storeData)

  } catch (error) {
    // Check if it's a Prisma connection error
    if (error instanceof Error) {
      // Prisma connection errors - don't spam Sentry for bot requests
      if (error.message.includes('Response from the Engine was empty') || 
          error.message.includes('PrismaClientKnownRequestError') ||
          error.name === 'PrismaClientUnknownRequestError') {
        // Only log to Sentry if it's not a suspicious slug (likely bot)
        const isSuspiciousSlug = /\.(php|asp|jsp|xml|txt)$/i.test(slug)
        
        if (!isSuspiciousSlug) {
          Sentry.captureException(error, {
            tags: {
              endpoint: 'storefront_get',
              method: 'GET',
              error_type: 'prisma_error',
            },
            extra: {
              slug,
              url: request.url,
            },
          })
        }
        
        // Return 404 for bot requests, 500 for real errors
        return NextResponse.json(
          { error: 'Store not found' },
          { status: isSuspiciousSlug ? 404 : 500 }
        )
      }
    }
    
    // Capture other errors in Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'storefront_get',
        method: 'GET',
        error_type: 'unexpected_error',
      },
      extra: {
        slug,
        url: request.url,
      },
    })
    
    console.error('Storefront API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}