// app/api/storefront/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getLocationFromIP, parseUserAgent, extractUTMParams } from '@/lib/geolocation'
import { trackVisitorSession } from '@/lib/trackVisitorSession'
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

    // Find business by slug (optimized for connected businesses)
    const business = await prisma.business.findUnique({
      where: { 
        slug,
        isActive: true,
        setupWizardCompleted: true
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

    // Optimized query for connected businesses
    // Check if business has connections (performance optimization)
    const hasConnections = business.connectedBusinesses && Array.isArray(business.connectedBusinesses) && business.connectedBusinesses.length > 0
    
    // Build businessIds array for queries
    const businessIds = hasConnections 
      ? [business.id, ...business.connectedBusinesses]
      : [business.id]

    // PERFORMANCE OPTIMIZATION: Fetch categories WITHOUT products initially
    // Products will be loaded on-demand via separate API endpoint
    const categories = await prisma.category.findMany({
      where: {
        businessId: hasConnections ? { in: businessIds } : business.id,
        isActive: true
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        nameAl: true,
        description: true,
        descriptionAl: true,
        image: true,
        parentId: true,
        sortOrder: true,
        hideParentInStorefront: true,
        // @ts-ignore - Parent relation
        parent: {
          select: {
            id: true,
            name: true,
            nameAl: true,
            hideParentInStorefront: true
          }
        },
        // @ts-ignore - Children relation
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
        // Only get product COUNT for initial load (not actual products)
        _count: {
          select: {
            products: {
              where: {
                businessId: hasConnections ? { in: businessIds } : business.id,
                isActive: true,
                price: { gt: 0 }
              }
            }
          }
        }
      }
    })

    // Attach categories to business object
    business.categories = categories

    // PERFORMANCE: Fetch initial 24 products for server-side render (fast page load)
    let initialProducts: any[] = []
    try {
      const productWhere: any = {
        businessId: hasConnections ? { in: businessIds } : business.id,
        isActive: true,
        price: { gt: 0 }
      }

      const initialProductsRaw = await prisma.product.findMany({
        where: productWhere,
        take: 24,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          descriptionAl: true,
          images: true,
          price: true,
          originalPrice: true,
          sku: true,
          stock: true,
          trackInventory: true,
          featured: true,
          metaTitle: true,
          metaDescription: true,
          categoryId: true,
          saleStartDate: true,
          saleEndDate: true,
          collectionIds: true,
          groupIds: true,
          brandId: true,
          variants: {
            orderBy: { price: 'asc' },
            select: {
              id: true,
              name: true,
              price: true,
              originalPrice: true,
              stock: true,
              sku: true,
              metadata: true,
              saleStartDate: true,
              saleEndDate: true
            }
          },
          modifiers: {
            orderBy: { price: 'asc' },
            select: {
              id: true,
              name: true,
              price: true,
              required: true
            }
          }
        }
      })

      // Transform products (same logic as products API)
      const storefrontLanguage = business.storefrontLanguage || business.language || 'en'
      const useAlbanian = storefrontLanguage === 'al' || storefrontLanguage === 'sq'
      const exceptionSlugs = ['swarovski', 'swatch', 'villeroy-boch']
      const isExceptionSlug = exceptionSlugs.includes(slug)

      const calculateEffectivePrice = (price: number, originalPrice: number | null, saleStartDate: Date | null, saleEndDate: Date | null) => {
        const now = new Date()
        const isSaleActive = (!saleStartDate || now >= saleStartDate) && (!saleEndDate || now <= saleEndDate)
        if (isSaleActive && originalPrice && originalPrice > price) {
          return { effectivePrice: price, effectiveOriginalPrice: originalPrice }
        }
        return {
          effectivePrice: originalPrice && originalPrice > price ? originalPrice : price,
          effectiveOriginalPrice: null
        }
      }

      initialProducts = initialProductsRaw
        .filter((product: any) => {
          if (product.trackInventory) {
            if (product.variants && product.variants.length > 0) {
              return product.variants.some((v: any) => v.stock > 0)
            }
            return product.stock > 0
          }
          return true
        })
        .map((product: any) => {
          const productPricing = calculateEffectivePrice(
            product.price,
            product.originalPrice,
            product.saleStartDate,
            product.saleEndDate
          )

          const productDescription = isExceptionSlug
            ? (product.description || product.descriptionAl || '')
            : (useAlbanian && product.descriptionAl 
              ? product.descriptionAl 
              : product.description)

          return {
            id: product.id,
            name: product.name,
            description: productDescription,
            descriptionAl: product.descriptionAl,
            images: product.images,
            price: productPricing.effectivePrice,
            originalPrice: productPricing.effectiveOriginalPrice,
            sku: product.sku,
            stock: product.stock,
            trackInventory: product.trackInventory,
            featured: product.featured,
            metaTitle: product.metaTitle,
            metaDescription: product.metaDescription,
            categoryId: product.categoryId,
            collectionIds: product.collectionIds || [],
            groupIds: product.groupIds || [],
            brandId: product.brandId,
            variants: product.variants.map((variant: any) => {
              const variantPricing = calculateEffectivePrice(
                variant.price,
                variant.originalPrice,
                variant.saleStartDate,
                variant.saleEndDate
              )
              return {
                id: variant.id,
                name: variant.name,
                price: variantPricing.effectivePrice,
                originalPrice: variantPricing.effectiveOriginalPrice,
                stock: variant.stock,
                sku: variant.sku,
                metadata: variant.metadata || null,
                saleStartDate: variant.saleStartDate || null,
                saleEndDate: variant.saleEndDate || null
              }
            }),
            modifiers: product.modifiers.map((modifier: any) => ({
              id: modifier.id,
              name: modifier.name,
              price: modifier.price,
              required: modifier.required
            }))
          }
        })
    } catch (error) {
      console.error('Error fetching initial products:', error)
      // Continue without initial products - client will fetch them
    }

    // Fetch additional entities for custom menu/filtering (if enabled)
    let collections: any[] = []
    let groups: any[] = []
    let brands: any[] = []

    if (business.customMenuEnabled || business.customFilteringEnabled) {
      const customFilterSettings = business.customFilterSettings as any || {}
      
      // PERFORMANCE OPTIMIZATION: Fetch only needed fields for collections/groups/brands
      // Fetch collections if menu enabled OR filtering enabled for collections
      if (business.customMenuEnabled || customFilterSettings.collectionsEnabled) {
        collections = await prisma.collection.findMany({
          where: {
            businessId: hasConnections ? { in: businessIds } : business.id,
            isActive: true
          },
          select: {
            id: true,
            name: true,
            nameAl: true,
            sortOrder: true,
            isActive: true
          },
          orderBy: { sortOrder: 'asc' }
        })
      }
      
      // Fetch groups if menu enabled OR filtering enabled for groups
      if (business.customMenuEnabled || customFilterSettings.groupsEnabled) {
        groups = await prisma.group.findMany({
          where: {
            businessId: hasConnections ? { in: businessIds } : business.id,
            isActive: true
          },
          select: {
            id: true,
            name: true,
            nameAl: true,
            sortOrder: true,
            isActive: true
          },
          orderBy: { sortOrder: 'asc' }
        })
      }
      
      // Fetch brands if filtering enabled for brands
      if (customFilterSettings.brandsEnabled) {
        brands = await prisma.brand.findMany({
          where: {
            businessId: hasConnections ? { in: businessIds } : business.id,
            isActive: true
          },
          select: {
            id: true,
            name: true,
            nameAl: true,
            sortOrder: true,
            isActive: true
          },
          orderBy: { sortOrder: 'asc' }
        })
      }
    }

    // Fetch custom menu items if custom menu is enabled
    let customMenuItems: any[] = []
    if (business.customMenuEnabled) {
      customMenuItems = (business.customMenuItems as any[]) || []
      
      // Populate target entity details for each menu item
      const menuItemsWithTargets = customMenuItems
        .filter((item: any) => item.isActive)
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((item: any) => {
          let target = null
          
          if (item.type === 'group' && item.targetId) {
            target = groups.find(g => g.id === item.targetId)
          } else if (item.type === 'collection' && item.targetId) {
            target = collections.find(c => c.id === item.targetId)
          } else if (item.type === 'category' && item.targetId) {
            target = business.categories.find((cat: any) => cat.id === item.targetId)
          }
          
          return { ...item, target }
        })
      
      customMenuItems = menuItemsWithTargets
    }

    // Attach to business object
    business.collections = collections
    business.groups = groups
    business.brands = brands
    business.customMenuItems = customMenuItems

    // Extract tracking data from request
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined
    
    // Get IP address - handle various proxy/CDN headers
    // Priority: cf-connecting-ip (Cloudflare) > x-real-ip > x-forwarded-for (first IP is the original client)
    let ipAddress: string | undefined
    
    // Cloudflare
    const cfIP = request.headers.get('cf-connecting-ip')
    if (cfIP) {
      ipAddress = cfIP.trim()
    } else {
      // Vercel/other proxies - x-real-ip is usually the client IP
      const realIP = request.headers.get('x-real-ip')
      if (realIP) {
        ipAddress = realIP.trim()
      } else {
        // x-forwarded-for - FIRST IP in chain is the original client
        const forwardedFor = request.headers.get('x-forwarded-for')
        if (forwardedFor) {
          const ips = forwardedFor.split(',').map(ip => ip.trim()).filter(ip => ip)
          // Use FIRST IP (original client), not last (which is the final proxy/CDN)
          ipAddress = ips.length > 0 ? ips[0] : undefined
        }
      }
    }
    
    // Fallback to request.ip if available
    if (!ipAddress) {
      // @ts-ignore - NextRequest.ip might be available
      ipAddress = request.ip || undefined
    }

    // Track visitor session - run in background, don't await
    // This allows the response to return quickly while tracking happens async
    ;(async () => {
      try {
        await trackVisitorSession(business.id, {
          ipAddress,
          userAgent,
          referrer,
          url: request.url
        })
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: 'track_visitor_session',
            businessId: business.id,
          },
          extra: {
            slug,
          },
        })
      }
    })()

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
      coverBackgroundSize: business.coverBackgroundSize,
      coverBackgroundPosition: business.coverBackgroundPosition,
      coverHeight: business.coverHeight,
      coverHeightMobile: business.coverHeightMobile,
      coverHeightDesktop: business.coverHeightDesktop,
      logoPadding: business.logoPadding,
      logoObjectFit: business.logoObjectFit,
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
      deliveryTimeText: business.deliveryTimeText,  // Custom delivery time text for RETAIL
      freeDeliveryText: business.freeDeliveryText,  // Custom free delivery text for RETAIL
      
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
      
      // Custom Features
      customMenuEnabled: business.customMenuEnabled,
      customMenuItems: business.customMenuItems || [],
      customFilteringEnabled: business.customFilteringEnabled,
      customFilterSettings: business.customFilterSettings || {},
      collections: business.collections || [],
      groups: business.groups || [],
      brands: business.brands || [],

      // Initial products for server-side render (first 24)
      initialProducts: initialProducts || [],

      // Menu
      categories: (() => {
        // Helper function to calculate effective price based on sale dates
        const calculateEffectivePrice = (price: number, originalPrice: number | null, saleStartDate: Date | null, saleEndDate: Date | null): { effectivePrice: number; effectiveOriginalPrice: number | null } => {
          const now = new Date()
          
          // Check if sale is currently active
          const isSaleActive = (!saleStartDate || now >= saleStartDate) && (!saleEndDate || now <= saleEndDate)
          
          if (isSaleActive && originalPrice && originalPrice > price) {
            // Sale is active, use sale price
            return {
              effectivePrice: price,
              effectiveOriginalPrice: originalPrice
            }
          } else {
            // Sale is not active, use regular price
            return {
              effectivePrice: originalPrice && originalPrice > price ? originalPrice : price,
              effectiveOriginalPrice: null
            }
          }
        }
        
        // Get storefront language (default to business language or 'en')
        const storefrontLanguage = business.storefrontLanguage || business.language || 'en'
        const useAlbanian = storefrontLanguage === 'al' || storefrontLanguage === 'sq'
        
        // Get Uncategorized name overrides (for storefront display only)
        const uncategorizedNameOverride = business.uncategorizedNameOverride || null
        const uncategorizedNameOverrideAl = business.uncategorizedNameOverrideAl || null
        
        // Helper function to apply Uncategorized name override for storefront display
        const getCategoryDisplayName = (categoryName: string, categoryNameAl?: string | null): string => {
          // Only apply override if category name is exactly "Uncategorized"
          if (categoryName === 'Uncategorized') {
            if (useAlbanian && uncategorizedNameOverrideAl) {
              return uncategorizedNameOverrideAl
            }
            if (uncategorizedNameOverride) {
              return uncategorizedNameOverride
            }
          }
          // Return normal category name (with language preference)
          return useAlbanian && categoryNameAl ? categoryNameAl : categoryName
        }
        
        // PERFORMANCE OPTIMIZATION: Build categories WITHOUT products
        // Products will be loaded on-demand via /api/storefront/[slug]/products endpoint
        const allCategories = (business.categories as any[])
          .map((category: any) => {
            const productCount = category._count?.products || 0
            
            return {
              id: category.id,
              name: getCategoryDisplayName(category.name, category.nameAl),
              description: useAlbanian && category.descriptionAl ? category.descriptionAl : category.description,
              nameAl: category.nameAl,
              descriptionAl: category.descriptionAl,
              parentId: category.parentId,
              parent: category.parent ? {
                id: category.parent.id,
                name: getCategoryDisplayName(category.parent.name, category.parent.nameAl),
                hideParentInStorefront: category.parent.hideParentInStorefront
              } : null,
              hideParentInStorefront: category.hideParentInStorefront,
              image: category.image,
              sortOrder: category.sortOrder,
              productCount, // Include product count for filtering
              children: category.children ? (category.children as any[]).map((child: any) => ({
                id: child.id,
                name: getCategoryDisplayName(child.name, child.nameAl),
                description: useAlbanian && child.descriptionAl ? child.descriptionAl : child.description,
                nameAl: child.nameAl,
                descriptionAl: child.descriptionAl,
                image: child.image,
                sortOrder: child.sortOrder
              })) : [],
              products: [] // Empty array - products loaded separately
            }
          })
        
        // Filter categories that have at least 1 product (using count)
        const filteredCategories = allCategories
          .filter((category: any) => {
            // Child categories: must have at least 1 product
            if (category.parentId) {
              return category.productCount > 0
            }
            
            // Parent categories: must have products OR have children with products
            if (category.children && category.children.length > 0) {
              // Check if any child has products
              const childrenWithProducts = category.children.filter((child: any) => {
                const childCategory = allCategories.find((c: any) => c.id === child.id)
                return childCategory && childCategory.productCount > 0
              })
              // Show parent if it has products OR has children with products
              return category.productCount > 0 || childrenWithProducts.length > 0
            }
            
            // Parent without children: must have products
            return category.productCount > 0
          })
          .map((category: any) => {
            // Filter children to only include those with products
            const childrenWithProducts = category.children
              ? category.children.filter((child: any) => {
                  const childCategory = allCategories.find((c: any) => c.id === child.id)
                  return childCategory && childCategory.productCount > 0
                })
              : []
            
            return {
              ...category,
              children: childrenWithProducts
            }
          })
        
        // Separate parent and child categories
        const parentCategories = filteredCategories.filter((cat: any) => !cat.parentId)
        const childCategories = filteredCategories.filter((cat: any) => cat.parentId)
        
        // Check if we should hide single parent
        if (parentCategories.length === 1 && parentCategories[0].hideParentInStorefront) {
          // Return only children of that parent in flat structure
          const parentId = parentCategories[0].id
          return childCategories
            .filter((child: any) => child.parentId === parentId && child.productCount > 0)
            .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        }
        
        // Return both parent and child categories in flat array
        // Parent categories have children nested, but child categories are also in the flat array
        // This allows frontend to find child categories by ID
        return filteredCategories.sort((a: any, b: any) => {
          // Sort parents first, then children
          if (!a.parentId && b.parentId) return -1
          if (a.parentId && !b.parentId) return 1
          // Within same level, sort by sortOrder
          return a.sortOrder - b.sortOrder
        })
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