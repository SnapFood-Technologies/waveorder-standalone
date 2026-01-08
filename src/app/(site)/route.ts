// src/app/(site)/route.ts
// Handle POST requests (likely bots/scanners) to prevent JSON/form parse errors
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    // Handle multipart/form-data (common in bot requests)
    if (contentType.includes('multipart/form-data')) {
      // Don't try to parse multipart - just return 405
      // Parsing would cause "Unexpected end of form" errors
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      )
    }
    
    // Try to parse JSON body (if present)
    try {
      await request.json()
    } catch {
      // Invalid JSON or empty body - that's fine, just return 405
    }
    
    // Return 405 Method Not Allowed for POST requests to homepage
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  } catch (error) {
    // Catch any other errors (like form parsing errors)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
