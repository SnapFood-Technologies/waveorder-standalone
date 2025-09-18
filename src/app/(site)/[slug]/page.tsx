// app/[slug]/page.tsx
import { notFound } from 'next/navigation'
import StoreFront from '@/components/storefront/StoreFront'
import type { Metadata } from 'next'

interface PageProps {
  params: { slug: string }
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

function getBusinessTypeDefaults(businessType: string) {
  switch (businessType) {
    case 'RESTAURANT':
      return {
        titleSuffix: 'Order Food Online',
        description: 'Fresh food delivered to your door',
        keywords: 'restaurant, food delivery, takeout, dining'
      }
    case 'CAFE':
      return {
        titleSuffix: 'Order Coffee & Food Online',
        description: 'Fresh coffee and food delivered to your door',
        keywords: 'cafe, coffee, food delivery, breakfast, lunch'
      }
    case 'RETAIL':
      return {
        titleSuffix: 'Shop Online',
        description: 'Quality products delivered to your door',
        keywords: 'shopping, retail, products, delivery'
      }
    case 'GROCERY':
      return {
        titleSuffix: 'Grocery Delivery',
        description: 'Fresh groceries delivered to your door',
        keywords: 'grocery, food delivery, fresh produce, groceries'
      }
    case 'JEWELRY':
      return {
        titleSuffix: 'Jewelry Store',
        description: 'Beautiful jewelry and accessories',
        keywords: 'jewelry, rings, necklaces, accessories'
      }
    case 'FLORIST':
      return {
        titleSuffix: 'Fresh Flowers',
        description: 'Beautiful fresh flowers delivered',
        keywords: 'flowers, florist, bouquets, delivery'
      }
    default:
      return {
        titleSuffix: 'Order Online',
        description: 'Quality products delivered to your door',
        keywords: 'business, products, services, delivery'
      }
  }
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const storeData = await getStoreData(params.slug)
  
  if (!storeData) {
    return {
      title: 'Store Not Found',
      description: 'The requested store could not be found.'
    }
  }

  const businessDefaults = getBusinessTypeDefaults(storeData.businessType)
  
  const title = storeData.seoTitle || `${storeData.name} - ${businessDefaults.titleSuffix}`
  const description = storeData.seoDescription || `Order from ${storeData.name}. ${storeData.description || businessDefaults.description}`
  const keywords = storeData.seoKeywords || `${storeData.name}, ${businessDefaults.keywords}, ${storeData.address?.split(',')[0] || ''}`
  
  const primaryImage = storeData.coverImage || storeData.logo || storeData.ogImage
  const images = primaryImage ? [{ url: primaryImage, width: 1200, height: 630 }] : []
  
  return {
    title,
    description,
    keywords,
    robots: storeData.noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      title,
      description,
      images,
      type: 'website',
      siteName: storeData.name,
      locale: storeData.language || 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: primaryImage ? [primaryImage] : [],
    },
    alternates: {
      canonical: storeData.canonicalUrl || `https://waveorder.app/${params.slug}`,
    },
    other: {
      'business:contact_data:street_address': storeData.address || '',
      'business:contact_data:locality': storeData.address?.split(',')[1]?.trim() || '',
      'business:contact_data:phone_number': storeData.phone || '',
      'business:contact_data:website': storeData.website || '',
    }
  }
}

export default async function StorePage({ params }: PageProps) {
  const storeData = await getStoreData(params.slug)

  if (!storeData) {
    notFound()
  }

  const priceRange = getPriceRange(storeData.categories, storeData.currency)
  const primaryImage = storeData.coverImage || storeData.logo

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": storeData.schemaType || "LocalBusiness",
            "name": storeData.name,
            "description": storeData.description,
            "image": primaryImage,
            "logo": storeData.logo,
            "url": storeData.canonicalUrl || `https://waveorder.app/${params.slug}`,
            "telephone": storeData.phone,
            "email": storeData.email,
            "priceRange": priceRange,
            "currenciesAccepted": storeData.currency,
            "paymentAccepted": storeData.paymentMethods?.join(', ') || 'Cash',
            "address": storeData.address ? {
              "@type": "PostalAddress",
              "streetAddress": storeData.address
            } : undefined,
            "acceptsReservations": storeData.dineInEnabled,
            "hasDeliveryService": storeData.deliveryEnabled,
            "hasTakeawayService": storeData.pickupEnabled,
            "openingHours": storeData.openingHoursSchema,
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": storeData.whatsappNumber,
              "contactType": "customer service",
              "availableLanguage": storeData.language || "en"
            },
            ...(storeData.schemaData || {})
          })
        }}
      />
      
      {storeData.favicon && (
        <link rel="icon" href={storeData.favicon} />
      )}
      
      <StoreFront storeData={storeData} />
    </>
  )
}