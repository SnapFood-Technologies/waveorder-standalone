// app/api/whatsapp/test-message/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    // Generate WhatsApp URL for testing
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`

    return NextResponse.json({ 
      success: true, 
      url: whatsappUrl,
      message: 'WhatsApp URL generated successfully'
    })
  } catch (error) {
    return NextResponse.json({ message: 'Error generating WhatsApp URL' }, { status: 500 })
  }
}
