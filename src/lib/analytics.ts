// lib/analytics.ts - Utility function for tracking views
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function trackBusinessView(businessId: string): Promise<void> {
  try {
    // Get today's date in YYYY-MM-DD format (normalized to start of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Try to find existing analytics record for today
    const existingAnalytics = await prisma.analytics.findUnique({
      where: {
        businessId_date: {
          businessId: businessId,
          date: today
        }
      }
    })

    if (existingAnalytics) {
      // Update existing record - increment visitors count
      await prisma.analytics.update({
        where: {
          id: existingAnalytics.id
        },
        data: {
          visitors: {
            increment: 1
          },
          updatedAt: new Date()
        }
      })
    } else {
      // Create new analytics record for today
      await prisma.analytics.create({
        data: {
          businessId: businessId,
          date: today,
          visitors: 1,
          orders: 0,
          revenue: 0
        }
      })
    }
  } catch (error) {
    // Log error but don't throw - we don't want view tracking to break the storefront
    console.error('Error tracking business view:', error)
  } finally {
    await prisma.$disconnect()
  }
}