// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://waveorder.app'
  
  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date | string) => {
    return new Date(date).toISOString().split('T')[0]
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/demo`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sitemap`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: formatDate('2025-09-18'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  let businessPages: MetadataRoute.Sitemap = []

  // Fetch published business catalogs from database
  try {
    const publishedBusinesses = await prisma.business.findMany({
      where: {
        isActive: true,
        isIndexable: true, // Must be indexable
        noIndex: false, // Must not have noIndex set
        slug: {
          // not: null,
          not: undefined
        }
      },
      select: {
        slug: true,
        updatedAt: true,
        createdAt: true,
        subscriptionPlan: true,
        canonicalUrl: true,
        language: true,
        users: {
          select: {
            role: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }   // Recently updated businesses first
      ]
    })

    // Generate business catalog URLs
    businessPages = publishedBusinesses.flatMap((business) => {
      // Higher priority for premium businesses
      let priority = 0.6
      
      if (business.subscriptionPlan === 'PREMIUM' || business.subscriptionPlan === 'ENTERPRISE' || business.subscriptionPlan === 'PRO') {
        priority = 0.8 // Premium/Pro/Enterprise businesses get higher priority
      } else if (business.subscriptionPlan === 'BASIC') {
        priority = 0.7 // Basic plan businesses
      }

      // Determine change frequency based on activity
      let changeFreq: 'daily' | 'weekly' | 'monthly' = 'monthly'
      const daysSinceUpdate = Math.floor(
        (new Date().getTime() - new Date(business.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceUpdate < 7) {
        changeFreq = 'weekly'
      } else if (daysSinceUpdate < 30) {
        changeFreq = 'weekly'
      }

      const baseUrl = business.canonicalUrl ? 
        new URL(business.canonicalUrl).origin : 
        'https://waveorder.app'

      const entries: MetadataRoute.Sitemap = [
        {
          url: `${baseUrl}/${business.slug}`,
          lastModified: formatDate(business.updatedAt),
          changeFrequency: changeFreq,
          priority,
        }
      ]

      return entries
    })

  } catch (error) {
    console.error('Error fetching businesses for sitemap:', error)
  } finally {
    await prisma.$disconnect()
  }

  // Combine all pages
  return [...staticPages, ...businessPages]
}