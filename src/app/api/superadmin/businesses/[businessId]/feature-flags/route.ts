// src/app/api/superadmin/businesses/[businessId]/feature-flags/route.ts
// SuperAdmin API for managing feature flags (Manual Team Creation & Delivery Management)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logSystemEvent, getActualRequestUrl } from '@/lib/systemLog'

// GET - Fetch feature flags for a business
export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params

    // Fetch business with feature flags
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        enableManualTeamCreation: true,
        enableDeliveryManagement: true,
        invoiceReceiptSelectionEnabled: true,
        packagingTrackingEnabled: true,
        internalInvoiceEnabled: true,
        internalExpensesEnabled: true,
        enableAffiliateSystem: true,
        enableTeamPaymentTracking: true,
        legalPagesEnabled: true,
        websiteEmbedEnabled: true,
        currency: true,
        storefrontLanguage: true,
        language: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get summary data for delivery management if enabled
    let deliverySummary = null
    if (business.enableDeliveryManagement) {
      const [
        totalEarnings,
        pendingEarnings,
        totalPayments,
        deliveryPersonsCount
      ] = await Promise.all([
        prisma.deliveryEarning.aggregate({
          where: { businessId },
          _sum: { amount: true },
          _count: true
        }),
        prisma.deliveryEarning.aggregate({
          where: {
            businessId,
            status: 'PENDING'
          },
          _sum: { amount: true },
          _count: true
        }),
        prisma.deliveryPayment.aggregate({
          where: { businessId },
          _sum: { amount: true },
          _count: true
        }),
        prisma.businessUser.count({
          where: {
            businessId,
            role: 'DELIVERY'
          }
        })
      ])

      deliverySummary = {
        totalEarnings: totalEarnings._sum.amount || 0,
        totalEarningsCount: totalEarnings._count,
        pendingEarnings: pendingEarnings._sum.amount || 0,
        pendingEarningsCount: pendingEarnings._count,
        totalPayments: totalPayments._sum.amount || 0,
        totalPaymentsCount: totalPayments._count,
        deliveryPersonsCount
      }
    }

    // Get summary for manual team creation
    let teamSummary = null
    if (business.enableManualTeamCreation) {
      const teamMembersCount = await prisma.businessUser.count({
        where: {
          businessId,
          role: { not: 'OWNER' }
        }
      })

      teamSummary = {
        totalTeamMembers: teamMembersCount
      }
    }

    let websiteEmbedSummary: { visits: number; lastVisitAt: string | null } | null = null
    if (business.websiteEmbedEnabled) {
      const [embedVisits, lastEmbed] = await Promise.all([
        prisma.visitorSession.count({
          where: { businessId, fromWebsiteEmbed: true }
        }),
        prisma.visitorSession.findFirst({
          where: { businessId, fromWebsiteEmbed: true },
          orderBy: { visitedAt: 'desc' },
          select: { visitedAt: true }
        })
      ])
      websiteEmbedSummary = {
        visits: embedVisits,
        lastVisitAt: lastEmbed?.visitedAt?.toISOString() ?? null
      }
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency
      },
      settings: {
        enableManualTeamCreation: business.enableManualTeamCreation,
        enableDeliveryManagement: business.enableDeliveryManagement,
        invoiceReceiptSelectionEnabled: business.invoiceReceiptSelectionEnabled,
        packagingTrackingEnabled: business.packagingTrackingEnabled,
        internalInvoiceEnabled: business.internalInvoiceEnabled,
        internalExpensesEnabled: business.internalExpensesEnabled,
        enableAffiliateSystem: business.enableAffiliateSystem,
        enableTeamPaymentTracking: business.enableTeamPaymentTracking,
        legalPagesEnabled: business.legalPagesEnabled,
        websiteEmbedEnabled: business.websiteEmbedEnabled
      },
      summary: {
        delivery: deliverySummary,
        team: teamSummary,
        websiteEmbed: websiteEmbedSummary
      }
    })
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    )
  }
}

// PATCH - Update feature flags for a business
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params
    const body = await request.json()

    const { enableManualTeamCreation, enableDeliveryManagement, invoiceReceiptSelectionEnabled, packagingTrackingEnabled, internalInvoiceEnabled, internalExpensesEnabled, enableAffiliateSystem, enableTeamPaymentTracking, legalPagesEnabled, websiteEmbedEnabled } = body

    // Validate business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (enableManualTeamCreation !== undefined) {
      updateData.enableManualTeamCreation = enableManualTeamCreation === true
    }
    if (enableDeliveryManagement !== undefined) {
      updateData.enableDeliveryManagement = enableDeliveryManagement === true
    }
    if (invoiceReceiptSelectionEnabled !== undefined) {
      updateData.invoiceReceiptSelectionEnabled = invoiceReceiptSelectionEnabled === true
    }
    if (packagingTrackingEnabled !== undefined) {
      updateData.packagingTrackingEnabled = packagingTrackingEnabled === true
    }
    if (internalInvoiceEnabled !== undefined) {
      updateData.internalInvoiceEnabled = internalInvoiceEnabled === true
    }
    if (internalExpensesEnabled !== undefined) {
      updateData.internalExpensesEnabled = internalExpensesEnabled === true
    }
    if (enableAffiliateSystem !== undefined) {
      updateData.enableAffiliateSystem = enableAffiliateSystem === true
    }
    if (enableTeamPaymentTracking !== undefined) {
      updateData.enableTeamPaymentTracking = enableTeamPaymentTracking === true
    }
    if (legalPagesEnabled !== undefined) {
      updateData.legalPagesEnabled = legalPagesEnabled === true
    }
    if (websiteEmbedEnabled !== undefined) {
      updateData.websiteEmbedEnabled = websiteEmbedEnabled === true
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        name: true,
        enableManualTeamCreation: true,
        enableDeliveryManagement: true,
        invoiceReceiptSelectionEnabled: true,
        packagingTrackingEnabled: true,
        internalInvoiceEnabled: true,
        internalExpensesEnabled: true,
        enableAffiliateSystem: true,
        enableTeamPaymentTracking: true,
        legalPagesEnabled: true,
        websiteEmbedEnabled: true
      }
    })

    const messages = []
    if (enableManualTeamCreation !== undefined) {
      messages.push(`Manual Team Creation ${updatedBusiness.enableManualTeamCreation ? 'enabled' : 'disabled'}`)
    }
    if (enableDeliveryManagement !== undefined) {
      messages.push(`Delivery Management ${updatedBusiness.enableDeliveryManagement ? 'enabled' : 'disabled'}`)
    }
    if (invoiceReceiptSelectionEnabled !== undefined) {
      messages.push(`Invoice/Receipt Selection ${updatedBusiness.invoiceReceiptSelectionEnabled ? 'enabled' : 'disabled'}`)
    }
    if (packagingTrackingEnabled !== undefined) {
      messages.push(`Packaging Tracking ${updatedBusiness.packagingTrackingEnabled ? 'enabled' : 'disabled'}`)
    }
    if (internalInvoiceEnabled !== undefined) {
      messages.push(`Internal Invoice System ${updatedBusiness.internalInvoiceEnabled ? 'enabled' : 'disabled'}`)
    }
    if (internalExpensesEnabled !== undefined) {
      messages.push(`Internal Expenses ${updatedBusiness.internalExpensesEnabled ? 'enabled' : 'disabled'}`)
    }
    if (enableAffiliateSystem !== undefined) {
      messages.push(`Affiliate System ${updatedBusiness.enableAffiliateSystem ? 'enabled' : 'disabled'}`)
    }
    if (enableTeamPaymentTracking !== undefined) {
      messages.push(`Team Payment Tracking ${updatedBusiness.enableTeamPaymentTracking ? 'enabled' : 'disabled'}`)
    }
    if (legalPagesEnabled !== undefined) {
      messages.push(`Legal Pages ${updatedBusiness.legalPagesEnabled ? 'enabled' : 'disabled'}`)
    }
    if (websiteEmbedEnabled !== undefined) {
      messages.push(`Website embed ${updatedBusiness.websiteEmbedEnabled ? 'enabled' : 'disabled'}`)
    }

    if (websiteEmbedEnabled !== undefined) {
      await logSystemEvent({
        logType: 'admin_action',
        severity: 'info',
        endpoint: `/api/superadmin/businesses/${businessId}/feature-flags`,
        method: 'PATCH',
        url: getActualRequestUrl(request),
        businessId,
        slug: business.slug,
        errorMessage: `Website embed ${updatedBusiness.websiteEmbedEnabled ? 'enabled' : 'disabled'} for ${business.name} by ${session.user.email}`,
        metadata: {
          action: 'website_embed_feature_flag',
          businessName: business.name,
          businessSlug: business.slug,
          previousValue: business.websiteEmbedEnabled,
          newValue: updatedBusiness.websiteEmbedEnabled,
          updatedBy: session.user.email,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: messages.join(' and ') + ` for ${updatedBusiness.name}`,
      settings: {
        enableManualTeamCreation: updatedBusiness.enableManualTeamCreation,
        enableDeliveryManagement: updatedBusiness.enableDeliveryManagement,
        invoiceReceiptSelectionEnabled: updatedBusiness.invoiceReceiptSelectionEnabled,
        packagingTrackingEnabled: updatedBusiness.packagingTrackingEnabled,
        internalInvoiceEnabled: updatedBusiness.internalInvoiceEnabled,
        internalExpensesEnabled: updatedBusiness.internalExpensesEnabled,
        enableAffiliateSystem: updatedBusiness.enableAffiliateSystem,
        enableTeamPaymentTracking: updatedBusiness.enableTeamPaymentTracking,
        legalPagesEnabled: updatedBusiness.legalPagesEnabled,
        websiteEmbedEnabled: updatedBusiness.websiteEmbedEnabled
      }
    })
  } catch (error) {
    console.error('Error updating feature flags:', error)
    return NextResponse.json(
      { error: 'Failed to update feature flags' },
      { status: 500 }
    )
  }
}
