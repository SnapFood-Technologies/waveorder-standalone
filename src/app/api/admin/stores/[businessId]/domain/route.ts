/**
 * Domain Management API
 * 
 * GET - Fetch current domain configuration
 * POST - Add/update custom domain
 * DELETE - Remove custom domain
 * 
 * Requires BUSINESS plan subscription.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { 
  validateDomain, 
  normalizeDomain, 
  generateVerificationToken,
  getVerificationRecordName 
} from '@/lib/domain-validation'
import { removeDomain, updateDomainStatus } from '@/lib/domain-provisioning'

// Verification token expires in 7 days
const VERIFICATION_EXPIRY_DAYS = 7

/**
 * GET - Fetch current domain configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    // Check access
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    // Get business with domain info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        slug: true,
        customDomain: true,
        domainStatus: true,
        domainVerificationToken: true,
        domainVerificationExpiry: true,
        domainProvisionedAt: true,
        domainLastChecked: true,
        domainError: true,
        subscriptionPlan: true
      }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check if business has BUSINESS plan
    const hasDomainFeature = business.subscriptionPlan === 'BUSINESS'

    // Build response
    const response = {
      hasFeature: hasDomainFeature,
      domain: {
        customDomain: business.customDomain,
        status: business.domainStatus,
        verificationToken: business.domainVerificationToken,
        verificationExpiry: business.domainVerificationExpiry,
        provisionedAt: business.domainProvisionedAt,
        lastChecked: business.domainLastChecked,
        error: business.domainError
      },
      instructions: business.customDomain && business.domainStatus === 'PENDING' ? {
        serverIP: process.env.SERVER_IP || 'YOUR_SERVER_IP',
        txtRecordName: getVerificationRecordName(business.customDomain),
        txtRecordValue: business.domainVerificationToken
      } : null,
      storefrontUrl: business.customDomain && business.domainStatus === 'ACTIVE'
        ? `https://${business.customDomain}`
        : `https://waveorder.app/${business.slug}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching domain config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domain configuration' },
      { status: 500 }
    )
  }
}

/**
 * POST - Add or update custom domain
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    // Check access
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    // Get business and verify plan
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        slug: true,
        customDomain: true,
        domainStatus: true,
        subscriptionPlan: true
      }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check BUSINESS plan requirement
    if (business.subscriptionPlan !== 'BUSINESS') {
      return NextResponse.json(
        { 
          error: 'Custom domains require a BUSINESS plan subscription',
          code: 'PLAN_REQUIRED'
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { domain } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    // Validate domain
    const validation = await validateDomain(domain, businessId)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error, code: 'INVALID_DOMAIN' },
        { status: 400 }
      )
    }

    const normalizedDomain = validation.normalizedDomain!

    // If changing domain, remove old one first
    if (business.customDomain && business.customDomain !== normalizedDomain) {
      if (business.domainStatus === 'ACTIVE') {
        await removeDomain(business.customDomain)
      }
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()
    const verificationExpiry = new Date()
    verificationExpiry.setDate(verificationExpiry.getDate() + VERIFICATION_EXPIRY_DAYS)

    // Update business with new domain
    await prisma.business.update({
      where: { id: businessId },
      data: {
        customDomain: normalizedDomain,
        domainStatus: 'PENDING',
        domainVerificationToken: verificationToken,
        domainVerificationExpiry: verificationExpiry,
        domainProvisionedAt: null,
        domainError: null
      }
    })

    // Return instructions
    return NextResponse.json({
      success: true,
      message: 'Domain saved. Please configure DNS records to verify ownership.',
      domain: normalizedDomain,
      status: 'PENDING',
      instructions: {
        serverIP: process.env.SERVER_IP || 'YOUR_SERVER_IP',
        steps: [
          {
            type: 'A_RECORD',
            name: normalizedDomain,
            value: process.env.SERVER_IP || 'YOUR_SERVER_IP',
            description: 'Point your domain to our server'
          },
          {
            type: 'TXT_RECORD',
            name: getVerificationRecordName(normalizedDomain),
            value: verificationToken,
            description: 'Verify domain ownership'
          }
        ],
        note: 'DNS changes can take up to 48 hours to propagate, but usually complete within 5-30 minutes.'
      },
      expiresAt: verificationExpiry
    })
  } catch (error) {
    console.error('Error saving domain:', error)
    return NextResponse.json(
      { error: 'Failed to save domain' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove custom domain
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    // Check access
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    // Get business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        customDomain: true,
        domainStatus: true
      }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    if (!business.customDomain) {
      return NextResponse.json(
        { error: 'No custom domain configured' },
        { status: 400 }
      )
    }

    // Remove domain from server if it was active
    if (business.domainStatus === 'ACTIVE') {
      const removeResult = await removeDomain(business.customDomain)
      if (!removeResult.success) {
        console.error('Failed to remove domain from server:', removeResult.error)
        // Continue anyway to clear database
      }
    }

    // Clear domain from database
    await updateDomainStatus(businessId, 'NONE')

    return NextResponse.json({
      success: true,
      message: 'Custom domain removed successfully'
    })
  } catch (error) {
    console.error('Error removing domain:', error)
    return NextResponse.json(
      { error: 'Failed to remove domain' },
      { status: 500 }
    )
  }
}
