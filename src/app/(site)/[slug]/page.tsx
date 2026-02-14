// app/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import StoreFront from '@/components/storefront/StoreFront'
import SalonStoreFront from '@/components/storefront/SalonStoreFront'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getStoreData(slug: string, searchParams?: Record<string, string | string[] | undefined>) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    // Get headers from the original request
    const headersList = await headers()
    
    // Extract client IP and other tracking data
    const cfIP = headersList.get('cf-connecting-ip')
    const xRealIP = headersList.get('x-real-ip')
    const xForwardedFor = headersList.get('x-forwarded-for')
    const userAgent = headersList.get('user-agent')
    const referer = headersList.get('referer')
    
    // Build query string from search params
    const queryString = searchParams ? new URLSearchParams(
      Object.entries(searchParams).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = Array.isArray(value) ? value[0] : value
        }
        return acc
      }, {} as Record<string, string>)
    ).toString() : ''
    
    const url = queryString 
      ? `${baseUrl}/api/storefront/${slug}?${queryString}`
      : `${baseUrl}/api/storefront/${slug}`
    
    // Forward the client's headers to the API route
    const fetchHeaders: HeadersInit = {}
    if (cfIP) fetchHeaders['cf-connecting-ip'] = cfIP
    if (xRealIP) fetchHeaders['x-real-ip'] = xRealIP
    if (xForwardedFor) fetchHeaders['x-forwarded-for'] = xForwardedFor
    if (userAgent) fetchHeaders['user-agent'] = userAgent
    if (referer) fetchHeaders['referer'] = referer
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: fetchHeaders
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

function getBusinessTypeDefaults(businessType: string, language = 'en') {
  const defaults = {
    RESTAURANT: {
      en: {
        titleSuffix: 'Order Food Online',
        description: 'Fresh food delivered to your door',
        keywords: 'restaurant, food delivery, takeout, dining'
      },
      sq: {
        titleSuffix: 'Porosit Ushqim Online',
        description: 'Ushqim i freskët dërguar në shtëpinë tuaj',
        keywords: 'restorant, dërgim ushqimi, marrje në vend, ngrënie'
      },
      al: {
        titleSuffix: 'Porosit Ushqim Online',
        description: 'Ushqim i freskët dërguar në shtëpinë tuaj',
        keywords: 'restorant, dërgim ushqimi, marrje në vend, ngrënie'
      },
      es: {
        titleSuffix: 'Pedir Comida Online',
        description: 'Comida fresca entregada en tu puerta',
        keywords: 'restaurante, entrega de comida, comida para llevar, cena'
      },
      el: {
        titleSuffix: 'Παραγγελία Φαγητού Online',
        description: 'Φρέσκο φαγητό στην πόρτα σας',
        keywords: 'εστιατόριο, διανομή φαγητού, πακέτο, φαγητό'
      },
      gr: {
        titleSuffix: 'Παραγγελία Φαγητού Online',
        description: 'Φρέσκο φαγητό στην πόρτα σας',
        keywords: 'εστιατόριο, διανομή φαγητού, πακέτο, φαγητό'
      }
    },
    CAFE: {
      en: {
        titleSuffix: 'Order Coffee & Food Online',
        description: 'Fresh coffee and food delivered to your door',
        keywords: 'cafe, coffee, food delivery, breakfast, lunch'
      },
      sq: {
        titleSuffix: 'Porosit Kafe dhe Ushqim Online',
        description: 'Kafe dhe ushqim i freskët dërguar në shtëpinë tuaj',
        keywords: 'kafe, kafe, dërgim ushqimi, mëngjes, drekë'
      },
      al: {
        titleSuffix: 'Porosit Kafe dhe Ushqim Online',
        description: 'Kafe dhe ushqim i freskët dërguar në shtëpinë tuaj',
        keywords: 'kafe, kafe, dërgim ushqimi, mëngjes, drekë'
      },
      es: {
        titleSuffix: 'Pedir Café y Comida Online',
        description: 'Café y comida fresca entregada en tu puerta',
        keywords: 'cafetería, café, entrega de comida, desayuno, almuerzo'
      },
      el: {
        titleSuffix: 'Παραγγελία Καφέ & Φαγητού Online',
        description: 'Φρέσκο καφέ και φαγητό στην πόρτα σας',
        keywords: 'καφετέρια, καφές, διανομή φαγητού, πρωινό, μεσημεριανό'
      },
      gr: {
        titleSuffix: 'Παραγγελία Καφέ & Φαγητού Online',
        description: 'Φρέσκο καφέ και φαγητό στην πόρτα σας',
        keywords: 'καφετέρια, καφές, διανομή φαγητού, πρωινό, μεσημεριανό'
      }
    },
    RETAIL: {
      en: {
        titleSuffix: 'Shop Online',
        description: 'Quality products delivered to your door',
        keywords: 'shopping, retail, products, delivery'
      },
      sq: {
        titleSuffix: 'Blej Online',
        description: 'Produkte cilësore të dërguara në shtëpinë tuaj',
        keywords: 'blerje, shitje me pakicë, produkte, dërgim'
      },
      al: {
        titleSuffix: 'Blej Online',
        description: 'Produkte cilësore të dërguara në shtëpinë tuaj',
        keywords: 'blerje, shitje me pakicë, produkte, dërgim'
      },
      es: {
        titleSuffix: 'Comprar Online',
        description: 'Productos de calidad entregados en tu puerta',
        keywords: 'compras, retail, productos, entrega'
      },
      el: {
        titleSuffix: 'Αγορές Online',
        description: 'Προϊόντα ποιότητας στην πόρτα σας',
        keywords: 'αγορές, retail, προϊόντα, διανομή'
      },
      gr: {
        titleSuffix: 'Αγορές Online',
        description: 'Προϊόντα ποιότητας στην πόρτα σας',
        keywords: 'αγορές, retail, προϊόντα, διανομή'
      }
    },
    GROCERY: {
      en: {
        titleSuffix: 'Grocery Delivery',
        description: 'Fresh groceries delivered to your door',
        keywords: 'grocery, food delivery, fresh produce, groceries'
      },
      sq: {
        titleSuffix: 'Dërgim Ushqimesh',
        description: 'Ushqime të freskëta të dërguara në shtëpinë tuaj',
        keywords: 'ushqimore, dërgim ushqimi, prodhime të freskëta, ushqime'
      },
      al: {
        titleSuffix: 'Dërgim Ushqimesh',
        description: 'Ushqime të freskëta të dërguara në shtëpinë tuaj',
        keywords: 'ushqimore, dërgim ushqimi, prodhime të freskëτα, ushqime'
      },
      es: {
        titleSuffix: 'Entrega de Comestibles',
        description: 'Comestibles frescos entregados en tu puerta',
        keywords: 'supermercado, entrega de comida, productos frescos, comestibles'
      },
      el: {
        titleSuffix: 'Διανομή Προϊόντων',
        description: 'Φρέσκα προϊόντα στην πόρτα σας',
        keywords: 'σούπερ μάρκετ, διανομή φαγητού, φρέσκα προϊόντα, προϊόντα'
      },
      gr: {
        titleSuffix: 'Διανομή Προϊόντων',
        description: 'Φρέσκα προϊόντα στην πόρτα σας',
        keywords: 'σούπερ μάρκετ, διανομή φαγητού, φρέσκα προϊόντα, προϊόντα'
      }
    },
    SALON: {
      en: {
        titleSuffix: 'Book Appointment Online',
        description: 'Book your beauty and wellness services online',
        keywords: 'salon, beauty, appointments, booking, hair, nails, spa'
      },
      sq: {
        titleSuffix: 'Rezervo Termin Online',
        description: 'Rezervoni shërbimet tuaja të bukurisë dhe mirëqenies online',
        keywords: 'sallon, bukuri, termina, rezervim, flokë, thonj, spa'
      },
      al: {
        titleSuffix: 'Rezervo Termin Online',
        description: 'Rezervoni shërbimet tuaja të bukurisë dhe mirëqenies online',
        keywords: 'sallon, bukuri, termina, rezervim, flokë, thonj, spa'
      },
      es: {
        titleSuffix: 'Reservar Cita Online',
        description: 'Reserva tus servicios de belleza y bienestar online',
        keywords: 'salón, belleza, citas, reserva, cabello, uñas, spa'
      },
      el: {
        titleSuffix: 'Κράτηση Ραντεβού Online',
        description: 'Κρατήστε τις υπηρεσίες ομορφιάς και ευεξίας σας online',
        keywords: 'σαλόνι, ομορφιά, ραντεβού, κράτηση, μαλλιά, νύχια, σπα'
      },
      gr: {
        titleSuffix: 'Κράτηση Ραντεβού Online',
        description: 'Κρατήστε τις υπηρεσίες ομορφιάς και ευεξίας σας online',
        keywords: 'σαλόνι, ομορφιά, ραντεβού, κράτηση, μαλλιά, νύχια, σπα'
      }
    }
  }

  // Normalize language codes: 'gr' -> 'el', 'al' -> 'sq'
  const normalizedLang = language === 'gr' ? 'el' : language === 'al' ? 'sq' : language
  
  const businessDefaults = defaults[businessType as keyof typeof defaults] || {
    en: {
      titleSuffix: 'Order Online',
      description: 'Quality products delivered to your door',
      keywords: 'business, products, services, delivery'
    },
    sq: {
      titleSuffix: 'Porosit Online',
      description: 'Produkte cilësore të dërguara në shtëpinë tuaj',
      keywords: 'biznes, produkte, shërbime, dërgim'
    },
    al: {
      titleSuffix: 'Porosit Online',
      description: 'Produkte cilësore të dërguara në shtëpinë tuaj',
      keywords: 'biznes, produkte, shërbime, dërgim'
    },
    es: {
      titleSuffix: 'Pedir Online',
      description: 'Productos de calidad entregados en tu puerta',
      keywords: 'negocio, productos, servicios, entrega'
    },
    el: {
      titleSuffix: 'Παραγγελία Online',
      description: 'Προϊόντα ποιότητας στην πόρτα σας',
      keywords: 'επιχείρηση, προϊόντα, υπηρεσίες, διανομή'
    },
    gr: {
      titleSuffix: 'Παραγγελία Online',
      description: 'Προϊόντα ποιότητας στην πόρτα σας',
      keywords: 'επιχείρηση, προϊόντα, υπηρεσίες, διανομή'
    }
  }

  return businessDefaults[normalizedLang as keyof typeof businessDefaults] || businessDefaults.en
}

function getPriceRange(categories: any[], currency: string): string {
  // PERFORMANCE OPTIMIZATION: Categories no longer include products
  // Price range calculation would require a separate API call
  // For now, return default price range
  // TODO: Add price range API endpoint if needed for SEO
  return '$$'
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const storeData = await getStoreData(slug, resolvedSearchParams)
  
  if (!storeData) {
    return {
      title: 'Store Not Found',
      description: 'The requested store could not be found.'
    }
  }

  // FIXED: Use store's language setting from database
  const isAlbanian = storeData.language === 'sq' || storeData.language === 'al'
  const isGreek = storeData.language === 'el' || storeData.language === 'gr'
  const isSpanish = storeData.language === 'es'

  // Check if store should be indexed
  const shouldIndex = storeData.isIndexable && !storeData.noIndex && !storeData.isTemporarilyClosed

  const businessDefaults = getBusinessTypeDefaults(storeData.businessType, storeData.language || 'en')
  
  // Use localized SEO fields based on language, otherwise fall back to default
  const businessDescription = isAlbanian && storeData.descriptionAl 
    ? storeData.descriptionAl 
    : isGreek && storeData.descriptionEl
      ? storeData.descriptionEl
      : storeData.description
  const seoTitle = isAlbanian && storeData.seoTitleAl 
    ? storeData.seoTitleAl 
    : isGreek && storeData.seoTitleEl
      ? storeData.seoTitleEl
      : storeData.seoTitle
  const seoDescription = isAlbanian && storeData.seoDescriptionAl 
    ? storeData.seoDescriptionAl 
    : isGreek && storeData.seoDescriptionEl
      ? storeData.seoDescriptionEl
      : storeData.seoDescription
  const seoKeywords = isAlbanian && storeData.seoKeywordsAl 
    ? storeData.seoKeywordsAl 
    : isGreek && storeData.seoKeywordsEl
      ? storeData.seoKeywordsEl
      : storeData.seoKeywords
  
  const title = seoTitle || `${storeData.name} - ${businessDefaults.titleSuffix}`
  const description = seoDescription || `${isAlbanian ? 'Porosit nga' : 'Order from'} ${storeData.name}. ${businessDescription || businessDefaults.description}`
  const keywords = seoKeywords || `${storeData.name}, ${businessDefaults.keywords}, ${storeData.address?.split(',')[0] || ''}`
  
  // Prioritize ogImage, then coverImage, then logo
  const primaryImage = storeData.ogImage || storeData.coverImage || storeData.logo
  const images = primaryImage ? [{ url: primaryImage, width: 1200, height: 630 }] : []
  
  // Build robots directive
  let robots = 'index, follow'
  if (!shouldIndex) {
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
      locale: isAlbanian ? 'sq_AL' : isGreek ? 'el_GR' : isSpanish ? 'es_ES' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: primaryImage ? [primaryImage] : [],
    },
    alternates: {
      canonical: storeData.canonicalUrl || `https://waveorder.app/${slug}`,
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
  const resolvedSearchParams = await searchParams
  const storeData = await getStoreData(slug, resolvedSearchParams)

  if (!storeData) {
    notFound()
  }

  // FIXED: Use store's language setting from database
  const isAlbanian = storeData.language === 'sq' || storeData.language === 'al'
  const isGreek = storeData.language === 'el' || storeData.language === 'gr'
  const isSpanish = storeData.language === 'es'

  const priceRange = getPriceRange(storeData.categories, storeData.currency)
  const primaryImage = storeData.ogImage || storeData.coverImage || storeData.logo
  const businessDescription = isAlbanian && storeData.descriptionAl 
    ? storeData.descriptionAl 
    : isGreek && storeData.descriptionEl
      ? storeData.descriptionEl
      : storeData.description

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
            "url": storeData.canonicalUrl || `https://waveorder.app/${slug}`,
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
              "availableLanguage": isAlbanian ? "sq" : isGreek ? "el" : isSpanish ? "es" : "en"
            },
            "inLanguage": isAlbanian ? "sq" : isGreek ? "el" : isSpanish ? "es" : "en",
            "sameAs": storeData.website ? [storeData.website] : undefined,
            ...(storeData.schemaData || {})
          })
        }}
      />
      
      {/* Google Font - Load the selected font family for the storefront */}
      {storeData.fontFamily && storeData.fontFamily !== 'Arial' && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${storeData.fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`}
        />
      )}

      {/* Language Alternates */}
      <link rel="alternate" href={`https://waveorder.app/${slug}`} hrefLang={isAlbanian ? "sq" : isGreek ? "el" : isSpanish ? "es" : "en"} />
      <link rel="alternate" href={`https://waveorder.app/${slug}`} hrefLang="x-default" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={storeData.canonicalUrl || `https://waveorder.app/${slug}`} />
    
      {storeData.businessType === 'SALON' ? (
        <SalonStoreFront storeData={storeData} />
      ) : (
        <StoreFront storeData={storeData} />
      )}
    </>
  )
}