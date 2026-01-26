// app/api/setup/progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    let user = null

    // Try to get user via session first
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
    }
    
    // If no session, try setup token
    if (!user && token) {
      user = await prisma.user.findFirst({
        where: {
          setupToken: token,
          setupExpiry: {
            gt: new Date()
          }
        }
      })
    }

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userWithBusiness = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        businesses: {
          include: {
            business: {
              include: {
                categories: {
                  orderBy: { sortOrder: 'asc' }
                },
                products: {
                  include: {
                    category: true
                  }
                },
                TeamInvitation: {
                  where: {
                    status: 'PENDING'
                  }
                }
              }
            }
          }
        }
      }
    })

    // If user has a business, return its data
    if (userWithBusiness?.businesses && userWithBusiness.businesses.length > 0) {
      const business = userWithBusiness.businesses[0].business
      
      if (!business) {
        return NextResponse.json({ message: 'Business not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        currentStep: business.onboardingStep || 1,
        setupData: {
          businessType: business.businessType,
          currency: business.currency, // NEW FIELD
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
          paymentInstructions: business.paymentInstructions, // NEW FIELD
          whatsappSettings: {
            orderNumberFormat: business.orderNumberFormat,
            greetingMessage: business.greetingMessage,
            messageTemplate: business.messageTemplate
          },
          // NEW: Include categories, products, and team members
          categories: (business.categories || []).map(cat => ({
            id: cat.id,
            name: cat.name
          })),
          products: (business.products || []).map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category?.name || 'Uncategorized',
            description: product.description
          })),
          teamMembers: (business.TeamInvitation || []).map(invite => ({
            email: invite.email,
            role: invite.role
          }))
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