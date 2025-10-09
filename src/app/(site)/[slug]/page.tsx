// app/[slug]/page.tsx
import { notFound } from 'next/navigation'
import StoreFront from '@/components/storefront/StoreFront'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string }>
}

async function getStoreData(slug: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/storefront/${slug}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching store data:', error)
    return null
  }
}

function getBusinessTypeDefaults(businessType: string, isAlbanian = false) {
  const defaults = {
    RESTAURANT: {
      en: {
        titleSuffix: 'Order Food Online',
        description: 'Fresh food delivered to your door',
        keywords: 'restaurant, food delivery, takeout, dining'
      },
      al: {
        titleSuffix: 'Porosit Ushqim Online',
        description: 'Ushqim i freskët dërguar në shtëpinë tuaj',
        keywords: 'restorant, dërgim ushqimi, marrje në vend, ngrënie'
      }
    },
    CAFE: {
      en: {
        titleSuffix: 'Order Coffee & Food Online',
        description: 'Fresh coffee and food delivered to your door',
        keywords: 'cafe, coffee, food delivery, breakfast, lunch'
      },
      al: {
        titleSuffix: 'Porosit Kafe dhe Ushqim Online',
        description: 'Kafe dhe ushqim i freskët dërguar në shtëpinë tuaj',
        keywords: 'kafe, kafe, dërgim ushqimi, mëngjes, drekë'
      }
    },
    RETAIL: {
      en: {
        titleSuffix: 'Shop Online',
        description: 'Quality products delivered to your door',
        keywords: 'shopping, retail, products, delivery'
      },
      al: {
        titleSuffix: 'Blej Online',
        description: 'Produkte cilësore të dërguara në shtëpinë tuaj',
        keywords: 'blerje, shitje me pakicë, produkte, dërgim'
      }
    },
    GROCERY: {
      en: {
        titleSuffix: 'Grocery Delivery',
        description: 'Fresh groceries delivered to your door',
        keywords: 'grocery, food delivery, fresh produce, groceries'
      },
      al: {
        titleSuffix: 'Dërgim Ushqimesh',
        description: 'Ushqime të freskëta të dërguara në shtëpinë tuaj',
        keywords: 'ushqimore, dërgim ushqimi, prodhime të freskëta, ushqimore'
      }
    },
    JEWELRY: {
      en: {
        titleSuffix: 'Jewelry Store',
        description: 'Beautiful jewelry and accessories',
        keywords: 'jewelry, rings, necklaces, accessories'
      },
      al: {
        titleSuffix: 'Dyqan Bizhuterish',
        description: 'Bizhuteri të bukura dhe aksesorë',
        keywords: 'bizhuteri, unaza, gjerdan, aksesorë'
      }
    },
    FLORIST: {
      en: {
        titleSuffix: 'Fresh Flowers',
        description: 'Beautiful fresh flowers delivered',
        keywords: 'flowers, florist, bouquets, delivery'
      },
      al: {
        titleSuffix: 'Lule të Freskëta',
        description: 'Lule të bukura të freskëta të dërguara',
        keywords: 'lule, lulëtar, buketa, dërgim'
      }
    }
  }

  const businessDefaults = defaults[businessType as keyof typeof defaults] || {
    en: {
      titleSuffix: 'Order Online',
      description: 'Quality products delivered to your door',
      keywords: 'business, products, services, delivery'
    },
    al: {
      titleSuffix: 'Porosit Online',
      description: 'Produkte cilësore të dërguara në shtëpinë tuaj',
      keywords: 'biznes, produkte, shërbime, dërgim'
    }
  }

  return isAlbanian ? businessDefaults.al : businessDefaults.en
}

function getPriceRange(categories: any[], currency: string): string {
  if (!categories || categories.length === 0) return '$$'
  
  const prices = categories.flatMap(category => 
    category.products?.map((product: any) => product.price) || []
  ).filter(price => typeof price === 'number' && price > 0)
  
  if (prices.length === 0) return '$$'
  
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = (minPrice + maxPrice) / 2
  
  const currencyMultiplier = currency === 'USD' ? 1 : currency === 'EUR' ? 1.1 : currency === 'ALL' ? 0.01 : 1
  const adjustedAvg = avgPrice * currencyMultiplier
  
  if (adjustedAvg < 10) return '$'
  if (adjustedAvg < 25) return '$$'  
  if (adjustedAvg < 50) return '$$$'
  return '$$$$'
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { lang } = await searchParams
  const isAlbanian = lang === 'al' || lang === 'sq'
  const storeData = await getStoreData(slug)
  
  if (!storeData) {
    return {
      title: isAlbanian ? 'Dyqani Nuk u Gjet' : 'Store Not Found',
      description: isAlbanian ? 'Dyqani i kërkuar nuk mund të gjindej.' : 'The requested store could not be found.'
    }
  }

  // Check if store should be indexed
  const shouldIndex = storeData.isIndexable && !storeData.noIndex && !storeData.isTemporarilyClosed

  const businessDefaults = getBusinessTypeDefaults(storeData.businessType, isAlbanian)
  
  // Use Albanian SEO fields if available and language is Albanian, otherwise fall back to default
  const businessDescription = isAlbanian && storeData.descriptionAl ? storeData.descriptionAl : storeData.description
  const seoTitle = isAlbanian && storeData.seoTitleAl ? storeData.seoTitleAl : storeData.seoTitle
  const seoDescription = isAlbanian && storeData.seoDescriptionAl ? storeData.seoDescriptionAl : storeData.seoDescription
  const seoKeywords = isAlbanian && storeData.seoKeywordsAl ? storeData.seoKeywordsAl : storeData.seoKeywords
  
  const title = seoTitle || `${storeData.name} - ${businessDefaults.titleSuffix}`
  const description = seoDescription || `${isAlbanian ? 'Porosit nga' : 'Order from'} ${storeData.name}. ${businessDescription || businessDefaults.description}`
  const keywords = seoKeywords || `${storeData.name}, ${businessDefaults.keywords}, ${storeData.address?.split(',')[0] || ''}`
  
  // Prioritize ogImage, then coverImage, then logo
  const primaryImage = storeData.ogImage || storeData.coverImage || storeData.logo
  const images = primaryImage ? [{ url: primaryImage, width: 1200, height: 630 }] : []
  
  // Build robots directive
  let robots = 'index, follow'
  if (!shouldIndex || storeData.noIndex) {
    robots = 'noindex'
    if (storeData.noFollow) {
      robots += ', nofollow'
    }
  } else if (storeData.noFollow) {
    robots = 'index, nofollow'
  }
  
  return {
    title,
    description,
    keywords,
    robots,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
      siteName: storeData.name,
      locale: isAlbanian ? 'sq_AL' : (storeData.language || 'en_US'),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: primaryImage ? [primaryImage] : [],
    },
    alternates: {
      canonical: storeData.canonicalUrl || `https://waveorder.app/${slug}${isAlbanian ? '?lang=al' : ''}`,
      languages: {
        'en': `https://waveorder.app/${slug}`,
        'sq': `https://waveorder.app/${slug}?lang=al`
      }
    },
    other: {
      'business:contact_data:street_address': storeData.address || '',
      'business:contact_data:locality': storeData.address?.split(',')[1]?.trim() || '',
      'business:contact_data:phone_number': storeData.phone || '',
      'business:contact_data:website': storeData.website || '',
    },
    // Add favicon if available
    icons: storeData.favicon ? {
      icon: storeData.favicon,
      shortcut: storeData.favicon,
      apple: storeData.favicon,
    } : undefined
  }
}

export default async function StorePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { lang } = await searchParams
  // just to be extra safe, we are doing 2 comparisons
  const isAlbanian = lang === 'al' || lang === 'sq'
  const storeData = await getStoreData(slug)

  if (!storeData) {
    notFound()
  }

  const priceRange = getPriceRange(storeData.categories, storeData.currency)
  const primaryImage = storeData.ogImage || storeData.coverImage || storeData.logo
  const businessDescription = isAlbanian && storeData.descriptionAl ? storeData.descriptionAl : storeData.description

  // Build opening hours schema from business hours JSON
  const buildOpeningHoursSchema = (businessHours: any) => {
    if (!businessHours) return undefined
    
    const dayMap = {
      monday: 'Monday',
      tuesday: 'Tuesday', 
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    }
    
    const openingHours = []
    for (const [day, hours] of Object.entries(businessHours)) {
      // @ts-ignore
      if (hours && typeof hours === 'object' && !hours.closed && hours.open && hours.close) {
        // @ts-ignore
        openingHours.push(`${dayMap[day as keyof typeof dayMap]} ${hours.open}-${hours.close}`)
      }
    }
    
    return openingHours.length > 0 ? openingHours : undefined
  }

  const openingHoursSchema = buildOpeningHoursSchema(storeData.businessHours)
  
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": storeData.schemaType || "LocalBusiness",
            "name": storeData.name,
            "description": businessDescription,
            "image": primaryImage,
            "logo": storeData.logo,
            "url": storeData.canonicalUrl || `https://waveorder.app/${slug}${isAlbanian ? '?lang=al' : ''}`,
            "telephone": storeData.phone,
            "email": storeData.email,
            "priceRange": priceRange,
            "currenciesAccepted": storeData.currency,
            "paymentAccepted": storeData.paymentMethods?.join(', ') || (isAlbanian ? 'Para në dorë' : 'Cash'),
            "address": storeData.address ? {
              "@type": "PostalAddress",
              "streetAddress": storeData.address
            } : undefined,
            "geo": storeData.storeLatitude && storeData.storeLongitude ? {
              "@type": "GeoCoordinates",
              "latitude": storeData.storeLatitude,
              "longitude": storeData.storeLongitude
            } : undefined,
            "acceptsReservations": storeData.dineInEnabled,
            "hasDeliveryService": storeData.deliveryEnabled,
            "hasTakeawayService": storeData.pickupEnabled,
            "openingHours": openingHoursSchema,
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": storeData.whatsappNumber,
              "contactType": "customer service",
              "availableLanguage": isAlbanian ? "sq" : (storeData.language || "en")
            },
            "inLanguage": isAlbanian ? "sq" : (storeData.language || "en"),
            "sameAs": storeData.website ? [storeData.website] : undefined,
            ...(storeData.schemaData || {})
          })
        }}
      />
      
      {/* Language Alternates */}
      <link rel="alternate" href={`https://waveorder.app/${slug}`} hrefLang="en" />
      <link rel="alternate" href={`https://waveorder.app/${slug}`} hrefLang="x-default" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={storeData.canonicalUrl || `https://waveorder.app/${slug}`} />
    
      <StoreFront storeData={storeData} />
    </>
  )
}