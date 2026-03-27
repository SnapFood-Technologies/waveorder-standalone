import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { getCatalogCountryAggregatesForBusiness } from '@/lib/catalog-country-aggregates'

/**
 * GET — aggregates for admin "Country Based" hub (business users + SuperAdmin impersonation).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const data = await getCatalogCountryAggregatesForBusiness(businessId)
    return NextResponse.json(data)
  } catch (e) {
    console.error('catalog/countries GET', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
