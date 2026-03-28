import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCatalogCountryAggregatesForBusiness } from '@/lib/catalog-country-aggregates'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const data = await getCatalogCountryAggregatesForBusiness(businessId)
    return NextResponse.json(data)
  } catch (e) {
    console.error('superadmin catalog/countries GET', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
