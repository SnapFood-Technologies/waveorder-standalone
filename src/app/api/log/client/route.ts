// app/api/log/client/route.ts
// Client-side logging endpoint for tracking errors from the frontend
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    const {
      logType,
      severity = 'error',
      errorMessage,
      metadata,
      endpoint,
      url
    } = body

    // Validate required fields
    if (!logType) {
      return NextResponse.json({ message: 'logType is required' }, { status: 400 })
    }

    // Extract request info
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined

    // Log the event
    await logSystemEvent({
      logType,
      severity,
      endpoint: endpoint || '/client',
      method: 'POST',
      statusCode: severity === 'error' ? 500 : 200,
      errorMessage,
      ipAddress,
      userAgent,
      referrer,
      url: url || referrer || '',
      metadata: {
        ...metadata,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        source: 'client'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging client event:', error)
    return NextResponse.json(
      { message: 'Failed to log event' },
      { status: 500 }
    )
  }
}
