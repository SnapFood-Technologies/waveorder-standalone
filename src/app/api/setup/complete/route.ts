// app/api/setup/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient, BusinessType, SubscriptionPlan, PaymentMethod, BusinessGoal } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const setupData = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Create business with all setup data
    const business = await prisma.business.create({
      data: {
        name: setupData.businessName,
        slug: setupData.storeSlug,
        whatsappNumber: setupData.whatsappNumber,
        businessType: setupData.businessType as BusinessType,
        subscriptionPlan: setupData.subscriptionPlan as SubscriptionPlan,
        businessGoals: setupData.businessGoals as BusinessGoal[],
        
        // Delivery settings
        deliveryEnabled: setupData.deliveryMethods?.delivery || false,
        pickupEnabled: setupData.deliveryMethods?.pickup || true,
        dineInEnabled: setupData.deliveryMethods?.dineIn || false,
        deliveryFee: setupData.deliveryMethods?.deliveryFee || 0,
        deliveryRadius: setupData.deliveryMethods?.deliveryRadius || 10,
        estimatedDeliveryTime: setupData.deliveryMethods?.estimatedDeliveryTime,
        
        // Payment settings
        paymentMethods: setupData.paymentMethods as PaymentMethod[],
        
        // WhatsApp settings
        orderNumberFormat: setupData.whatsappSettings?.orderNumberFormat || 'WO-{number}',
        greetingMessage: setupData.whatsappSettings?.greetingMessage,
        
        // Setup completion
        setupWizardCompleted: true,
        onboardingCompleted: true,
        onboardingStep: 12,
        
        users: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        users: true
      }
    })

    // Create default category if products exist
    if (setupData.products?.length > 0) {
      const category = await prisma.category.create({
        data: {
          name: 'General',
          businessId: business.id,
          isActive: true,
          sortOrder: 0
        }
      })

      // Create products
      await prisma.product.createMany({
        data: setupData.products.map((product: any) => ({
          name: product.name,
          description: product.description,
          price: product.price,
          categoryId: category.id,
          businessId: business.id,
          isActive: true
        }))
      })
    }

    // Send team invitations if any
    if (setupData.teamMembers?.length > 0) {
      const invitations = setupData.teamMembers.map((member: any) => ({
        email: member.email,
        businessId: business.id,
        role: member.role,
        token: generateInviteToken(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }))

      await prisma.teamInvitation.createMany({
        data: invitations
      })

      // TODO: Send invitation emails
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug
      }
    })

  } catch (error) {
    console.error('Complete setup error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}
