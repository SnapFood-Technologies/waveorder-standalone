// app/api/superadmin/businesses/[businessId]/complete-setup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const data = await request.json()

    // Get the existing business with owner
    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          where: { role: 'OWNER' },
          include: { user: true },
          take: 1
        }
      }
    })

    if (!existingBusiness) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const owner = existingBusiness.users[0]?.user

    // Validate required fields
    if (data.name !== undefined && !data.name?.trim()) {
      return NextResponse.json({ message: 'Business name is required' }, { status: 400 })
    }

    if (data.whatsappNumber !== undefined && !data.whatsappNumber?.trim()) {
      return NextResponse.json({ message: 'WhatsApp number is required' }, { status: 400 })
    }

    if (data.address !== undefined && !data.address?.trim()) {
      return NextResponse.json({ message: 'Business address is required' }, { status: 400 })
    }

    // Validate slug format
    if (data.slug) {
      if (!/^[a-z0-9-]+$/.test(data.slug)) {
        return NextResponse.json({ message: 'Store URL can only contain lowercase letters, numbers, and hyphens' }, { status: 400 })
      }
      if (data.slug.length < 3) {
        return NextResponse.json({ message: 'Store URL must be at least 3 characters' }, { status: 400 })
      }
    }

    // Validate WhatsApp number format (basic check)
    if (data.whatsappNumber) {
      const cleanNumber = data.whatsappNumber.replace(/[\s-]/g, '')
      if (!/^\+?\d{8,15}$/.test(cleanNumber)) {
        return NextResponse.json({ message: 'Please enter a valid WhatsApp number' }, { status: 400 })
      }
    }

    // Check if slug is being changed and if new slug is available
    if (data.slug && data.slug !== existingBusiness.slug) {
      const slugExists = await prisma.business.findFirst({
        where: { 
          slug: data.slug,
          id: { not: businessId }
        }
      })
      if (slugExists) {
        return NextResponse.json({ message: 'This store URL is already taken' }, { status: 400 })
      }
    }

    // Build update data
    const updateData: any = {}

    // Basic info
    if (data.name) updateData.name = data.name
    if (data.slug) updateData.slug = data.slug
    
    // Contact info
    if (data.whatsappNumber) updateData.whatsappNumber = data.whatsappNumber
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.phone !== undefined) updateData.phone = data.phone || null
    if (data.address) updateData.address = data.address

    // Regional settings
    if (data.currency) updateData.currency = data.currency
    if (data.timezone) updateData.timezone = data.timezone
    if (data.language) {
      updateData.language = data.language
      updateData.storefrontLanguage = data.language
    }

    // Address coordinates and country
    if (data.country) updateData.country = data.country
    if (data.storeLatitude) updateData.storeLatitude = data.storeLatitude
    if (data.storeLongitude) updateData.storeLongitude = data.storeLongitude

    // Subscription
    if (data.subscriptionPlan) {
      updateData.subscriptionPlan = data.subscriptionPlan
      updateData.subscriptionStatus = 'ACTIVE'
    }

    // Billing type
    if (data.billingType) {
      updateData.billingType = data.billingType
      
      // Check if already on active trial
      const isCurrentlyOnTrial = existingBusiness.trialEndsAt && 
        new Date(existingBusiness.trialEndsAt) > new Date()
      
      // Handle trial setting
      if (data.billingType === 'trial') {
        // Only set new trial if NOT already on trial
        if (!isCurrentlyOnTrial) {
          const trialEnd = new Date()
          trialEnd.setDate(trialEnd.getDate() + 14)
          updateData.trialEndsAt = trialEnd
          
          // Also update the owner's trial fields
          if (owner) {
            await prisma.user.update({
              where: { id: owner.id },
              data: {
                trialUsed: true,
                trialEndsAt: trialEnd,
                graceEndsAt: null
              }
            })
          }
        }
        // If already on trial, keep existing trial dates (no changes)
      } else if (data.billingType === 'free') {
        // Clear trial dates for free plans
        updateData.trialEndsAt = null
        updateData.graceEndsAt = null
      } else if (data.billingType === 'monthly' || data.billingType === 'yearly') {
        // For paid plans, clear trial dates
        updateData.trialEndsAt = null
        updateData.graceEndsAt = null
      }
    }

    // Delivery settings
    if (data.deliveryEnabled !== undefined) updateData.deliveryEnabled = data.deliveryEnabled
    if (data.pickupEnabled !== undefined) updateData.pickupEnabled = data.pickupEnabled
    if (data.deliveryFee !== undefined) updateData.deliveryFee = data.deliveryFee
    if (data.minimumOrder !== undefined) updateData.minimumOrder = data.minimumOrder

    // Mark as complete
    if (data.markAsComplete) {
      updateData.setupWizardCompleted = true
      updateData.onboardingCompleted = true
      updateData.onboardingStep = 999
    }

    // Update the business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData
    })

    // Update owner password if provided
    let passwordUpdated = false
    if (data.ownerId && data.newPassword) {
      // Validate password length
      if (data.newPassword.length < 6) {
        return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
      }
      // Verify the owner exists and check auth method
      const owner = await prisma.user.findUnique({
        where: { id: data.ownerId },
        select: { 
          id: true, 
          password: true,
          accounts: { select: { provider: true } }
        }
      })

      // Determine auth method (same logic as other endpoints)
      let isOAuthUser = false
      if (owner?.accounts && owner.accounts.length > 0) {
        isOAuthUser = true // Has OAuth accounts (google or other)
      }

      // Only update password for non-OAuth users (email or magic-link)
      if (owner && !isOAuthUser) {
        const hashedPassword = await bcrypt.hash(data.newPassword, 12)
        await prisma.user.update({
          where: { id: data.ownerId },
          data: { password: hashedPassword }
        })
        passwordUpdated = true
      }
    }

    // Log the action
    console.log(`[SuperAdmin] Setup completed for business: ${updatedBusiness.name} by ${session.user.email}`, {
      businessId,
      fieldsUpdated: Object.keys(updateData),
      markedComplete: data.markAsComplete,
      passwordUpdated
    })

    return NextResponse.json({ 
      success: true, 
      message: passwordUpdated ? 'Setup completed and password updated' : 'Setup completed successfully',
      passwordUpdated,
      business: {
        id: updatedBusiness.id,
        name: updatedBusiness.name,
        slug: updatedBusiness.slug,
        setupWizardCompleted: updatedBusiness.setupWizardCompleted,
        onboardingCompleted: updatedBusiness.onboardingCompleted
      }
    })

  } catch (error) {
    console.error('Error completing setup:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
