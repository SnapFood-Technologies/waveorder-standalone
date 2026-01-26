// app/api/admin/stores/[businessId]/configuration/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PaymentMethod } from '@prisma/client'
import { prisma } from '@/lib/prisma'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        deliveryEnabled: true,
        pickupEnabled: true,
        dineInEnabled: true,
        deliveryFee: true,
        deliveryRadius: true,
        estimatedDeliveryTime: true,
        estimatedPickupTime: true,
        deliveryTimeText: true,
        freeDeliveryText: true,
        paymentMethods: true,
        paymentInstructions: true,
        whatsappNumber: true,
        orderNumberFormat: true,
        greetingMessage: true,
        messageTemplate: true,
        autoReply: true,
        autoReplyMessage: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const configuration = {
      deliveryMethods: {
        delivery: business.deliveryEnabled,
        pickup: business.pickupEnabled,
        dineIn: business.dineInEnabled,
        deliveryFee: business.deliveryFee,
        deliveryRadius: business.deliveryRadius,
        estimatedDeliveryTime: business.estimatedDeliveryTime || '30-45 minutes',
        estimatedPickupTime: business.estimatedPickupTime || '15-20 minutes',
        deliveryTimeText: business.deliveryTimeText || '',
        freeDeliveryText: business.freeDeliveryText || ''
      },
      paymentMethods: business.paymentMethods,
      paymentInstructions: business.paymentInstructions || '',
      whatsappSettings: {
        orderNumberFormat: business.orderNumberFormat || 'WO-{number}',
        greetingMessage: business.greetingMessage || '',
        messageTemplate: business.messageTemplate || '',
        autoReply: business.autoReply || false,
        autoReplyMessage: business.autoReplyMessage || ''
      },
      whatsappNumber: business.whatsappNumber || ''
    }

    return NextResponse.json({ configuration })

  } catch (error) {
    console.error('Error fetching configuration:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const config = await request.json()

    const updateData: any = {}

    if (config.deliveryMethods) {
      updateData.deliveryEnabled = Boolean(config.deliveryMethods.delivery)
      updateData.pickupEnabled = Boolean(config.deliveryMethods.pickup)
      updateData.dineInEnabled = Boolean(config.deliveryMethods.dineIn || false)
      
      if (config.deliveryMethods.delivery) {
        updateData.deliveryFee = config.deliveryMethods.deliveryFee || 0
        updateData.deliveryRadius = config.deliveryMethods.deliveryRadius || 10
        updateData.estimatedDeliveryTime = config.deliveryMethods.estimatedDeliveryTime || '30-45 minutes'
        // Retail-specific custom texts
        if (config.deliveryMethods.deliveryTimeText !== undefined) {
          updateData.deliveryTimeText = config.deliveryMethods.deliveryTimeText || null
        }
        if (config.deliveryMethods.freeDeliveryText !== undefined) {
          updateData.freeDeliveryText = config.deliveryMethods.freeDeliveryText || null
        }
      }
      
      if (config.deliveryMethods.pickup) {
        updateData.estimatedPickupTime = config.deliveryMethods.estimatedPickupTime || '15-20 minutes'
      }
    }

    if (config.paymentMethods) {
      updateData.paymentMethods = config.paymentMethods
    }

    if (config.paymentInstructions !== undefined) {
      updateData.paymentInstructions = config.paymentInstructions
    }

    if (config.whatsappSettings) {
      updateData.orderNumberFormat = config.whatsappSettings.orderNumberFormat || 'WO-{number}'
      if (config.whatsappSettings.greetingMessage !== undefined) {
        updateData.greetingMessage = config.whatsappSettings.greetingMessage
      }
      if (config.whatsappSettings.messageTemplate !== undefined) {
        updateData.messageTemplate = config.whatsappSettings.messageTemplate
      }
      updateData.autoReply = config.whatsappSettings.autoReply || false
      if (config.whatsappSettings.autoReplyMessage !== undefined) {
        updateData.autoReplyMessage = config.whatsappSettings.autoReplyMessage
      }
    }

    if (config.whatsappNumber !== undefined) {
      updateData.whatsappNumber = config.whatsappNumber
    }

    await prisma.business.update({
      where: { id: businessId },
      data: updateData
    })

    return NextResponse.json({ message: 'Configuration updated successfully' })

  } catch (error) {
    console.error('Error updating configuration:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}