// app/api/admin/stores/[businessId]/settings/business/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'


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
        id: true,
        name: true,
        slug: true,
        description: true,
        descriptionAl: true,
        descriptionEl: true,
        businessType: true,
        industry: true,
        address: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        coverImage: true,
        favicon: true,
        ogImage: true,
        currency: true,
        timezone: true,
        language: true,
        storefrontLanguage: true,
        timeFormat: true,
        translateContentToBusinessLanguage: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        seoTitleAl: true,
        seoDescriptionAl: true,
        seoKeywordsAl: true,
        seoTitleEl: true,
        seoDescriptionEl: true,
        seoKeywordsEl: true,
        schemaType: true,
        schemaData: true,
        canonicalUrl: true,
        isTemporarilyClosed: true,
        closureReason: true,
        closureMessage: true,
        closureStartDate: true,
        closureEndDate: true,
        isIndexable: true,
        noIndex: true,
        noFollow: true,
        whatsappNumber: true,
        storeLatitude: true,
        storeLongitude: true,
        uncategorizedNameOverride: true,
        uncategorizedNameOverrideAl: true,
        shippingCountries: true,
        invoiceReceiptSelectionEnabled: true,
        invoiceMinimumOrderValue: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const businessWithComputed = {
      ...business,
      noIndex: !business.isIndexable,
      closureStartDate: business.closureStartDate 
        ? new Date(business.closureStartDate.getTime() - business.closureStartDate.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16)
        : null,
      closureEndDate: business.closureEndDate 
        ? new Date(business.closureEndDate.getTime() - business.closureEndDate.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16)
        : null
    }

    return NextResponse.json({ business: businessWithComputed })

  } catch (error) {
    console.error('Error fetching business settings:', error)
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

    const data = await request.json()

    if (!data.name?.trim()) {
      return NextResponse.json({ message: 'Business name is required' }, { status: 400 })
    }

    if (!data.slug?.trim()) {
      return NextResponse.json({ message: 'Store URL is required' }, { status: 400 })
    }

    if (!data.address?.trim()) {
      return NextResponse.json({ message: 'Business address is required' }, { status: 400 })
    }

    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: { slug: true }
    })

    if (data.slug !== existingBusiness?.slug) {
      const slugExists = await prisma.business.findFirst({
        where: {
          slug: data.slug,
          id: { not: businessId }
        }
      })

      if (slugExists) {
        return NextResponse.json({ message: 'Store URL is already taken' }, { status: 400 })
      }
    }

    let parsedSchemaData = null
    if (data.schemaData) {
      try {
        parsedSchemaData = typeof data.schemaData === 'string' 
          ? JSON.parse(data.schemaData) 
          : data.schemaData
      } catch (error) {
        return NextResponse.json({ message: 'Invalid JSON in schema data' }, { status: 400 })
      }
    }

    let isIndexable = data.isIndexable
    let noIndex = data.noIndex
    let noFollow = data.noFollow || false

    if (typeof data.noIndex === 'boolean') {
      isIndexable = !data.noIndex
      noIndex = data.noIndex
    } else if (typeof data.isIndexable === 'boolean') {
      noIndex = !data.isIndexable
      isIndexable = data.isIndexable
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name.trim(),
        slug: data.slug.trim().toLowerCase(),
        description: data.description?.trim() || null,
        descriptionAl: data.descriptionAl?.trim() || null,
        descriptionEl: data.descriptionEl?.trim() || null,
        businessType: data.businessType,
        industry: data.industry?.trim() || null,
        address: data.address?.trim() || null,
        country: data.country?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        website: data.website?.trim() || null,
        logo: data.logo || null,
        coverImage: data.coverImage || null,
        favicon: data.favicon || null,
        ogImage: data.ogImage || null,
        currency: data.currency,
        timezone: data.timezone,
        language: data.language,
        storefrontLanguage: data.storefrontLanguage || data.language || 'en', // Defaults to business language if not set
        timeFormat: data.timeFormat || '24', // Default to 24-hour format
        translateContentToBusinessLanguage: data.translateContentToBusinessLanguage !== undefined ? data.translateContentToBusinessLanguage : true,
        seoTitle: data.seoTitle?.trim() || null,
        seoDescription: data.seoDescription?.trim() || null,
        seoKeywords: data.seoKeywords?.trim() || null,
        seoTitleAl: data.seoTitleAl?.trim() || null,
        seoDescriptionAl: data.seoDescriptionAl?.trim() || null,
        seoKeywordsAl: data.seoKeywordsAl?.trim() || null,
        seoTitleEl: data.seoTitleEl?.trim() || null,
        seoDescriptionEl: data.seoDescriptionEl?.trim() || null,
        seoKeywordsEl: data.seoKeywordsEl?.trim() || null,
        schemaType: data.schemaType || 'LocalBusiness',
        schemaData: parsedSchemaData,
        canonicalUrl: data.canonicalUrl?.trim() || null,
        isTemporarilyClosed: data.isTemporarilyClosed || false,
        closureReason: data.isTemporarilyClosed ? (data.closureReason?.trim() || null) : null,
        closureMessage: data.isTemporarilyClosed ? (data.closureMessage?.trim() || null) : null,
        closureStartDate: data.isTemporarilyClosed && data.closureStartDate 
          ? new Date(data.closureStartDate) : null,
        closureEndDate: data.isTemporarilyClosed && data.closureEndDate 
          ? new Date(data.closureEndDate) : null,
        isIndexable: isIndexable !== undefined ? isIndexable : true,
        noIndex: noIndex !== undefined ? noIndex : false,
        noFollow: noFollow,
        storeLatitude: data.storeLatitude ? parseFloat(data.storeLatitude) : null,
        storeLongitude: data.storeLongitude ? parseFloat(data.storeLongitude) : null,
        uncategorizedNameOverride: data.uncategorizedNameOverride?.trim() || null,
        uncategorizedNameOverrideAl: data.uncategorizedNameOverrideAl?.trim() || null,
        shippingCountries: Array.isArray(data.shippingCountries) ? data.shippingCountries : [],
        invoiceMinimumOrderValue: data.invoiceMinimumOrderValue !== undefined ? (data.invoiceMinimumOrderValue ? parseFloat(data.invoiceMinimumOrderValue) : null) : undefined,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        descriptionAl: true,
        descriptionEl: true,
        businessType: true,
        industry: true,
        address: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        coverImage: true,
        favicon: true,
        ogImage: true,
        currency: true,
        timezone: true,
        language: true,
        storefrontLanguage: true,
        timeFormat: true,
        translateContentToBusinessLanguage: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        seoTitleAl: true,
        seoDescriptionAl: true,
        seoKeywordsAl: true,
        seoTitleEl: true,
        seoDescriptionEl: true,
        seoKeywordsEl: true,
        schemaType: true,
        schemaData: true,
        canonicalUrl: true,
        isTemporarilyClosed: true,
        closureReason: true,
        closureMessage: true,
        closureStartDate: true,
        closureEndDate: true,
        isIndexable: true,
        noIndex: true,
        noFollow: true,
        storeLatitude: true,
        storeLongitude: true,
        shippingCountries: true
      }
    })

    const formattedBusiness = {
      ...updatedBusiness,
      closureStartDate: updatedBusiness.closureStartDate 
        ? new Date(updatedBusiness.closureStartDate.getTime() - updatedBusiness.closureStartDate.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16)
        : null,
      closureEndDate: updatedBusiness.closureEndDate 
        ? new Date(updatedBusiness.closureEndDate.getTime() - updatedBusiness.closureEndDate.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16)
        : null
    }

    return NextResponse.json({ business: formattedBusiness })

  } catch (error) {
    console.error('Error updating business settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}