/**
 * Domain Status API
 * 
 * GET - Get real-time domain status including DNS checks
 * 
 * Used for polling to show current verification progress.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkDNSConfiguration } from '@/lib/domain-verification'
import { getVerificationRecordName } from '@/lib/domain-validation'

/**
 * GET - Get real-time domain status
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

    // If no domain configured, return minimal status
    if (!business.customDomain) {
      return NextResponse.json({
        hasFeature: business.subscriptionPlan === 'BUSINESS',
        domain: null,
        status: 'NONE',
        dnsStatus: null
      })
    }

    // Build base response
    const response: any = {
      hasFeature: business.subscriptionPlan === 'BUSINESS',
      domain: business.customDomain,
      status: business.domainStatus,
      provisionedAt: business.domainProvisionedAt,
      lastChecked: business.domainLastChecked,
      error: business.domainError,
      expiresAt: business.domainVerificationExpiry
    }

    // If ACTIVE, no need to check DNS again
    if (business.domainStatus === 'ACTIVE') {
      response.dnsStatus = {
        txtVerified: true,
        aRecordVerified: true,
        cnameVerified: false,
        configured: true
      }
      response.url = `https://${business.customDomain}`
      return NextResponse.json(response)
    }

    // If PENDING, check real-time DNS status
    if (business.domainStatus === 'PENDING' && business.domainVerificationToken) {
      const dnsStatus = await checkDNSConfiguration(
        business.customDomain,
        business.domainVerificationToken
      )

      response.dnsStatus = {
        txtVerified: dnsStatus.txtVerified,
        aRecordVerified: dnsStatus.aRecordVerified,
        cnameVerified: dnsStatus.cnameRecordVerified,
        configured: dnsStatus.dnsConfigured
      }
      response.dnsDetails = dnsStatus.details
      response.dnsErrors = dnsStatus.errors

      // Add verification instructions
      response.instructions = {
        serverIP: process.env.SERVER_IP || 'YOUR_SERVER_IP',
        txtRecordName: getVerificationRecordName(business.customDomain),
        txtRecordValue: business.domainVerificationToken
      }

      // Update last checked time in background
      prisma.business.update({
        where: { id: businessId },
        data: { domainLastChecked: new Date() }
      }).catch(err => console.error('Failed to update lastChecked:', err))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching domain status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domain status' },
      { status: 500 }
    )
  }
}
