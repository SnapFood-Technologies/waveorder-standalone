/**
 * Domain Lookup API
 * 
 * Internal API for middleware to look up business by custom domain.
 * Not for public use - protected by internal request header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Verify internal request (from middleware)
  const isInternal = request.headers.get('x-internal-request') === 'true'
  
  // In production, only allow internal requests
  // In development, allow for testing
  if (!isInternal && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }
  
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 })
  }
  
  try {
    // Look up business by custom domain
    const business = await prisma.business.findFirst({
      where: {
        customDomain: domain.toLowerCase(),
        domainStatus: 'ACTIVE',
        isActive: true
      },
      select: {
        id: true,
        slug: true,
        name: true
      }
    })
    
    if (!business) {
      return NextResponse.json({ error: 'Domain not found or not active' }, { status: 404 })
    }
    
    return NextResponse.json({
      slug: business.slug,
      businessId: business.id,
      name: business.name
    })
    
  } catch (error) {
    console.error('Error looking up domain:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
