// app/api/user/default-business/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setDefaultStore, getDefaultStore } from '@/lib/store-limits'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const defaultStore = await getDefaultStore(session.user.id)
    
    if (!defaultStore) {
      return NextResponse.json({ message: 'No stores found' }, { status: 404 })
    }

    return NextResponse.json({
      defaultBusinessId: defaultStore.id,
      business: defaultStore
    })

  } catch (error) {
    console.error('Error getting default business:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await request.json()
    
    if (!businessId) {
      return NextResponse.json({ message: 'Business ID is required' }, { status: 400 })
    }

    const success = await setDefaultStore(session.user.id, businessId)
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to set default business. You may not have access to this business.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, defaultBusinessId: businessId })

  } catch (error) {
    console.error('Error setting default business:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
