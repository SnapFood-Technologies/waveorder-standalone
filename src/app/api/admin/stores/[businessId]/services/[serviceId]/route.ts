// app/api/admin/stores/[businessId]/services/[serviceId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; serviceId: string }> }
) {
  try {
    const { businessId, serviceId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const service = await prisma.product.findFirst({
      where: {
        id: serviceId,
        businessId,
        isService: true
      },
      include: {
        category: true,
        modifiers: true
      }
    })

    if (!service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ service })

  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; serviceId: string }> }
) {
  try {
    const { businessId, serviceId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const serviceData = await request.json()

    // Update service
    const service = await prisma.product.update({
      where: {
        id: serviceId,
        businessId
      },
      data: {
        name: serviceData.name,
        nameAl: serviceData.nameAl || null,
        nameEl: serviceData.nameEl || null,
        description: serviceData.description || null,
        descriptionAl: serviceData.descriptionAl || null,
        descriptionEl: serviceData.descriptionEl || null,
        images: serviceData.images || [],
        price: serviceData.price,
        originalPrice: serviceData.originalPrice || null,
        isActive: serviceData.isActive,
        featured: serviceData.featured,
        metaTitle: serviceData.metaTitle || null,
        metaDescription: serviceData.metaDescription || null,
        categoryId: serviceData.categoryId,
        // Salon-specific fields
        serviceDuration: serviceData.serviceDuration || null,
        requiresAppointment: serviceData.requiresAppointment ?? true,
        staffIds: serviceData.staffIds || []
      },
      include: {
        category: true,
        modifiers: true
      }
    })

    // Update modifiers
    await prisma.productModifier.deleteMany({
      where: { productId: serviceId }
    })

    if (serviceData.modifiers && serviceData.modifiers.length > 0) {
      await prisma.productModifier.createMany({
        data: serviceData.modifiers.map((modifier: any) => ({
          productId: serviceId,
          name: modifier.name,
          price: modifier.price,
          required: modifier.required ?? false
        }))
      })
    }

    // Fetch updated service with modifiers
    const updatedService = await prisma.product.findUnique({
      where: { id: serviceId },
      include: {
        category: true,
        modifiers: true
      }
    })

    return NextResponse.json({ service: updatedService })

  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; serviceId: string }> }
) {
  try {
    const { businessId, serviceId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if service exists and is a service
    const service = await prisma.product.findFirst({
      where: {
        id: serviceId,
        businessId,
        isService: true
      }
    })

    if (!service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 })
    }

    // Delete service (cascade will delete modifiers)
    await prisma.product.delete({
      where: { id: serviceId }
    })

    return NextResponse.json({ message: 'Service deleted successfully' })

  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
