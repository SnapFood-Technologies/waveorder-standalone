import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { step, data, setupToken } = await request.json()
    
    let user = null

    // Try to get user via session first
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
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
        }
      })
    }

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
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
      if (data.subscriptionPlan) updateData.subscriptionPlan = data.subscriptionPlan
      if (data.paymentMethods) updateData.paymentMethods = data.paymentMethods
      if (data.paymentInstructions !== undefined) updateData.paymentInstructions = data.paymentInstructions

      // Handle delivery methods - Now properly dynamic for both delivery AND pickup
      if (data.deliveryMethods) {
        updateData.deliveryEnabled = Boolean(data.deliveryMethods.delivery)
        updateData.pickupEnabled = Boolean(data.deliveryMethods.pickup)
        updateData.dineInEnabled = false // Disabled for v2
        
        // Only update delivery settings if delivery is enabled
        if (data.deliveryMethods.delivery) {
          updateData.deliveryFee = data.deliveryMethods.deliveryFee || 0
          updateData.deliveryRadius = data.deliveryMethods.deliveryRadius || 10
          updateData.estimatedDeliveryTime = data.deliveryMethods.estimatedDeliveryTime || '30-45 minutes'
        }
        
        // Only update pickup settings if pickup is enabled
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
      // Delete existing categories for this business
      await prisma.category.deleteMany({
        where: { businessId: business.id }
      })

      // Create new categories
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
      // Delete existing products for this business
      await prisma.product.deleteMany({
        where: { businessId: business.id }
      })

      if (data.products.length > 0) {
        // Get category IDs for products
        const categories = await prisma.category.findMany({
          where: { businessId: business.id }
        })

        const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]))

        // Create new products
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
      // Delete existing pending invitations for this business
      await prisma.teamInvitation.deleteMany({
        where: { 
          businessId: business.id,
          status: 'PENDING'
        }
      })

      // Create new invitations
      for (const member of data.teamMembers) {
        if (member.email && member.email.trim()) {
          await prisma.teamInvitation.create({
            data: {
              email: member.email.trim(),
              businessId: business.id,
              role: member.role || 'STAFF',
              token: crypto.randomUUID(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
  }
}