import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { createStripeCustomer, createFreeSubscription } from '@/lib/stripe'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { step, data, setupToken } = await request.json()
    
    let user = null

    // Try to get user via session first
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { subscription: true }
      })
    }
    
    // If no session, try setup token
    if (!user && setupToken) {
      user = await prisma.user.findFirst({
        where: {
          setupToken: setupToken,
          setupExpiry: {
            gt: new Date()
          }
        },
        include: { subscription: true }
      })
    }

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Handle subscription plan selection (Step 3)
    if (step === 3 && data.subscriptionPlan) {
      // If user chose FREE or skipped, create Stripe customer + FREE subscription
      if (data.subscriptionPlan === 'FREE' && !user.stripeCustomerId) {
        try {
          // Create Stripe customer
          const stripeCustomer = await createStripeCustomer(user.email, user.name || 'User')
          
          // Create FREE subscription in Stripe
          const stripeSubscription = await createFreeSubscription(stripeCustomer.id)
          
          // Create subscription in database
          const subscription = await prisma.subscription.create({
            data: {
              stripeId: stripeSubscription.id,
              status: stripeSubscription.status,
              priceId: process.env.STRIPE_FREE_PRICE_ID!,
              plan: 'FREE',
              // @ts-ignore
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              // @ts-ignore
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            }
          })

          // Update user with Stripe info
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripeCustomerId: stripeCustomer.id,
              subscriptionId: subscription.id,
              plan: 'FREE'
            }
          })

        } catch (stripeError) {
          console.error('❌ Stripe error during FREE subscription:', stripeError)
          // Continue with setup even if Stripe fails
        }
      }
      
      // If user chose PRO, we'll handle it in the checkout flow
      // Just save the selection for now
    }

    // Find or create business for this user
    let business = await prisma.business.findFirst({
      where: {
        users: {
          some: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    })

    if (!business) {
      // Create new business if it doesn't exist
      business = await prisma.business.create({
        data: {
          name: data.businessName || 'My Business',
          slug: data.storeSlug || `business-${Date.now()}`,
          businessType: data.businessType || 'OTHER',
          currency: data.currency || 'USD',
          language: data.language || 'en',
          whatsappNumber: data.whatsappNumber || '',
          subscriptionPlan: data.subscriptionPlan || 'FREE',
          subscriptionStatus: 'ACTIVE',
          onboardingStep: step,
          users: {
            create: {
              userId: user.id,
              role: 'OWNER'
            }
          }
        }
      })
    } else {
      // Update existing business with all the new fields
      const updateData: any = {
        onboardingStep: step,
      }

      // Only update fields that are provided
      if (data.businessName) updateData.name = data.businessName
      if (data.storeSlug) updateData.slug = data.storeSlug
      if (data.businessType) updateData.businessType = data.businessType
      if (data.currency) updateData.currency = data.currency
      if (data.language) updateData.language = data.language
      if (data.whatsappNumber) updateData.whatsappNumber = data.whatsappNumber
      if (data.businessGoals) updateData.businessGoals = data.businessGoals
      if (data.subscriptionPlan) {
        updateData.subscriptionPlan = data.subscriptionPlan
        updateData.subscriptionStatus = 'ACTIVE'
      }
      if (data.paymentMethods) updateData.paymentMethods = data.paymentMethods
      if (data.paymentInstructions !== undefined) updateData.paymentInstructions = data.paymentInstructions

      // Handle delivery methods
      if (data.deliveryMethods) {
        updateData.deliveryEnabled = Boolean(data.deliveryMethods.delivery)
        updateData.pickupEnabled = Boolean(data.deliveryMethods.pickup)
        updateData.dineInEnabled = false
        
        if (data.deliveryMethods.delivery) {
          updateData.deliveryFee = data.deliveryMethods.deliveryFee || 0
          updateData.deliveryRadius = data.deliveryMethods.deliveryRadius || 10
          updateData.estimatedDeliveryTime = data.deliveryMethods.estimatedDeliveryTime || '30-45 minutes'
        }
        
        if (data.deliveryMethods.pickup) {
          updateData.estimatedPickupTime = data.deliveryMethods.estimatedPickupTime || '15-20 minutes'
        }
      }

      // Handle WhatsApp settings
      if (data.whatsappSettings) {
        updateData.orderNumberFormat = data.whatsappSettings.orderNumberFormat || 'WO-{number}'
        if (data.whatsappSettings.greetingMessage !== undefined) updateData.greetingMessage = data.whatsappSettings.greetingMessage
        if (data.whatsappSettings.messageTemplate !== undefined) updateData.messageTemplate = data.whatsappSettings.messageTemplate
      }

      await prisma.business.update({
        where: { id: business.id },
        data: updateData
      })
    }

    // Handle categories
    if (data.categories && Array.isArray(data.categories)) {
      await prisma.category.deleteMany({
        where: { businessId: business.id }
      })

      if (data.categories.length > 0) {
        await prisma.category.createMany({
          data: data.categories.map((cat: any, index: number) => ({
            name: cat.name,
            businessId: business.id,
            sortOrder: index,
            isActive: true
          }))
        })
      }
    }

    // Handle products
    if (data.products && Array.isArray(data.products)) {
      await prisma.product.deleteMany({
        where: { businessId: business.id }
      })

      if (data.products.length > 0) {
        const categories = await prisma.category.findMany({
          where: { businessId: business.id }
        })

        const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]))

        for (const product of data.products) {
          const categoryId = categoryMap.get(product.category)
          if (categoryId) {
            await prisma.product.create({
              data: {
                name: product.name,
                description: product.description || null,
                price: product.price,
                businessId: business.id,
                categoryId: categoryId,
                isActive: true
              }
            })
          }
        }
      }
    }

    // Handle team invitations
    if (data.teamMembers && Array.isArray(data.teamMembers)) {
      await prisma.teamInvitation.deleteMany({
        where: { 
          businessId: business.id,
          status: 'PENDING'
        }
      })

      for (const member of data.teamMembers) {
        if (member.email && member.email.trim()) {
          await prisma.teamInvitation.create({
            data: {
              email: member.email.trim(),
              businessId: business.id,
              role: member.role || 'STAFF',
              token: crypto.randomUUID(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: 'PENDING'
            }
          })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      businessId: business.id,
      message: 'Progress saved successfully' 
    })

  } catch (error) {
    console.error('Save progress error:', error)
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}