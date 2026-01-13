import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all countries (public endpoint for storefront)
export async function GET(request: NextRequest) {
  try {
    console.log('[Countries API] Starting to fetch countries...')
    
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: { name: 'asc' }
    })

    console.log(`[Countries API] Successfully fetched ${countries.length} countries`)
    
    return NextResponse.json({ data: countries })
  } catch (error: any) {
    console.error('[Countries API] Error fetching countries:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      code: error?.code,
      meta: error?.meta
    })
    
    return NextResponse.json(
      { 
        message: 'Failed to fetch countries',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
