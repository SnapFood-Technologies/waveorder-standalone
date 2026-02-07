/**
 * Domain Verification API
 * 
 * POST - Trigger DNS verification and SSL provisioning
 * 
 * Checks DNS configuration and provisions SSL certificate if DNS is valid.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkDNSConfiguration } from '@/lib/domain-verification'
import { fullDomainProvisioningWorkflow } from '@/lib/domain-provisioning'

/**
 * POST - Verify DNS and provision domain
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
        subscriptionPlan: true
      }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Check BUSINESS plan
    if (business.subscriptionPlan !== 'BUSINESS') {
      return NextResponse.json(
        { 
          error: 'Custom domains require a BUSINESS plan subscription',
          code: 'PLAN_REQUIRED'
        },
        { status: 403 }
      )
    }

    // Check if domain is configured
    if (!business.customDomain) {
      return NextResponse.json(
        { error: 'No custom domain configured', code: 'NO_DOMAIN' },
        { status: 400 }
      )
    }

    // Check if already active
    if (business.domainStatus === 'ACTIVE') {
      return NextResponse.json({
        success: true,
        status: 'ACTIVE',
        message: 'Domain is already active',
        domain: business.customDomain
      })
    }

    // Check verification token
    if (!business.domainVerificationToken) {
      return NextResponse.json(
        { error: 'Verification token missing. Please save the domain again.', code: 'NO_TOKEN' },
        { status: 400 }
      )
    }

    // Check if verification expired
    if (business.domainVerificationExpiry && new Date(business.domainVerificationExpiry) < new Date()) {
      return NextResponse.json(
        { 
          error: 'Verification token expired. Please save the domain again to get a new token.',
          code: 'TOKEN_EXPIRED'
        },
        { status: 400 }
      )
    }

    // Check DNS configuration
    const dnsStatus = await checkDNSConfiguration(
      business.customDomain,
      business.domainVerificationToken
    )

    // If DNS not configured, return status without provisioning
    if (!dnsStatus.dnsConfigured) {
      // Update last checked timestamp
      await prisma.business.update({
        where: { id: businessId },
        data: {
          domainLastChecked: new Date(),
          domainError: dnsStatus.errors.join('; ')
        }
      })

      return NextResponse.json({
        success: false,
        status: 'PENDING',
        message: 'DNS not properly configured',
        dnsStatus: {
          txtVerified: dnsStatus.txtVerified,
          aRecordVerified: dnsStatus.aRecordVerified,
          cnameVerified: dnsStatus.cnameRecordVerified,
          configured: dnsStatus.dnsConfigured
        },
        errors: dnsStatus.errors,
        details: dnsStatus.details
      })
    }

    // DNS is configured - proceed with provisioning
    const provisionResult = await fullDomainProvisioningWorkflow(
      businessId,
      business.customDomain,
      business.slug,
      business.domainVerificationToken
    )

    if (provisionResult.success) {
      return NextResponse.json({
        success: true,
        status: 'ACTIVE',
        message: 'Domain successfully verified and provisioned!',
        domain: business.customDomain,
        url: `https://${business.customDomain}`
      })
    }

    // Provisioning failed
    return NextResponse.json({
      success: false,
      status: provisionResult.status,
      message: provisionResult.message,
      error: provisionResult.error,
      dnsStatus: {
        txtVerified: dnsStatus.txtVerified,
        aRecordVerified: dnsStatus.aRecordVerified,
        cnameVerified: dnsStatus.cnameRecordVerified,
        configured: dnsStatus.dnsConfigured
      }
    })

  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json(
      { error: 'Failed to verify domain' },
      { status: 500 }
    )
  }
}
