// app/api/setup/progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businesses: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
                businessType: true,
                businessGoals: true,
                subscriptionPlan: true,
                whatsappNumber: true,
                deliveryEnabled: true,
                pickupEnabled: true,
                dineInEnabled: true,
                deliveryFee: true,
                deliveryRadius: true,
                estimatedDeliveryTime: true,
                paymentMethods: true,
                orderNumberFormat: true,
                greetingMessage: true,
                setupWizardCompleted: true,
                onboardingStep: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // If user has a business, return its data
    if (user.businesses.length > 0) {
      const business = user.businesses[0].business
      return NextResponse.json({
        currentStep: business.onboardingStep || 1,
        setupData: {
          businessType: business.businessType,
          businessGoals: business.businessGoals,
          subscriptionPlan: business.subscriptionPlan,
          businessName: business.name,
          whatsappNumber: business.whatsappNumber,
          storeSlug: business.slug,
          deliveryMethods: {
            delivery: business.deliveryEnabled,
            pickup: business.pickupEnabled,
            dineIn: business.dineInEnabled,
            deliveryFee: business.deliveryFee,
            deliveryRadius: business.deliveryRadius,
            estimatedDeliveryTime: business.estimatedDeliveryTime
          },
          paymentMethods: business.paymentMethods,
          whatsappSettings: {
            orderNumberFormat: business.orderNumberFormat,
            greetingMessage: business.greetingMessage
          }
        },
        completed: business.setupWizardCompleted
      })
    }

    // Return empty progress for new setup
    return NextResponse.json({
      currentStep: 1,
      setupData: {},
      completed: false
    })

  } catch (error) {
    console.error('Get progress error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}