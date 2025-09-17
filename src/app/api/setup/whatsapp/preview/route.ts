// app/api/setup/whatsapp/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessName = searchParams.get('businessName') || 'Your Business'
    const orderFormat = searchParams.get('orderFormat') || 'WO-{number}'
    const deliveryFee = parseFloat(searchParams.get('deliveryFee') || '0')
    const storeUrl = searchParams.get('storeUrl') || 'waveorder.com/your-store'

    const orderNumber = orderFormat.replace('{number}', '123')
    
    const sampleOrder = `Order ${orderNumber}

2x Margherita Pizza (Large) - $18.99 each
1x Coca Cola - $2.99

---
Subtotal: $40.97
${deliveryFee > 0 ? `Delivery: $${deliveryFee.toFixed(2)}` : ''}
Total: $${(40.97 + deliveryFee).toFixed(2)}

---
Customer: John Doe
Phone: +1234567890
${deliveryFee > 0 ? 'Delivery Address: 123 Main St' : 'Pickup'}
${deliveryFee > 0 ? 'Delivery Time: ASAP' : 'Pickup Time: ASAP'}
Payment: Cash ${deliveryFee > 0 ? 'on Delivery' : 'on Pickup'}
Notes: Extra napkins please

---
${businessName}
${storeUrl}`

    return NextResponse.json({ message: sampleOrder })
  } catch (error) {
    return NextResponse.json({ message: 'Error generating preview' }, { status: 500 })
  }
}