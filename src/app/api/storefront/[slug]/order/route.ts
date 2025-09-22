// app/api/storefront/[slug]/order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Server-side address parsing function (same as customer creation)
function parseAndCleanAddress(addressString: string, latitude?: number, longitude?: number): any {
  if (!addressString?.trim()) return null;

  const address = addressString.trim();
  
  // If address contains commas, it's likely a formatted address
  if (address.includes(',')) {
    const parts = address.split(',').map((part: string) => part.trim());
    
    // First part is usually the actual street
    const street = parts[0];
    
    // Try to extract city from parts
    let city = '';
    if (parts.length >= 2) {
      let cityPart = parts[1];
      // Remove postal codes from city part
      cityPart = cityPart.replace(/\b\d{3,5}\s?\d{0,2}\b/g, '').trim();
      if (cityPart) {
        city = cityPart;
      }
    }
    
    // Try to extract postal code
    let zipCode = '';
    const zipMatches = address.match(/\b\d{3,5}\s?\d{0,2}\b/g);
    if (zipMatches) {
      zipCode = zipMatches[zipMatches.length - 1].replace(/\s+/g, ' ').trim();
    }
    
    // Try to extract country
    let country = 'US';
    const lastPart = parts[parts.length - 1].toLowerCase();
    if (lastPart.includes('albania') || lastPart.includes('al')) {
      country = 'AL';
    } else if (lastPart.includes('greece') || lastPart.includes('gr')) {
      country = 'GR';
    } else if (lastPart.includes('italy') || lastPart.includes('it')) {
      country = 'IT';
    }
    
    return {
      street,
      additional: '',
      zipCode,
      city,
      country,
      latitude: latitude || null,
      longitude: longitude || null
    };
  } else {
    // Simple address without commas
    return {
      street: address,
      additional: '',
      zipCode: '',
      city: '',
      country: 'US',
      latitude: latitude || null,
      longitude: longitude || null
    };
  }
}

// Updated zone-based delivery fee calculation with proper validation
async function calculateDeliveryFee(
  storeId: string, 
  customerLat: number, 
  customerLng: number
): Promise<{ fee: number; zone: string; distance: number }> {
  try {
    // Get store location and delivery zones
    const business = await prisma.business.findUnique({
      where: { id: storeId },
      select: {
        deliveryFee: true,
        deliveryRadius: true,
        deliveryEnabled: true,
        address: true,
        storeLatitude: true,
        storeLongitude: true,
        isTemporarilyClosed: true,
        deliveryZones: {
          where: { isActive: true },
          orderBy: { maxDistance: 'asc' }
        }
      }
    });

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.isTemporarilyClosed) {
      throw new Error('Store is temporarily closed');
    }

    if (!business.deliveryEnabled) {
      throw new Error('Delivery is not enabled for this store');
    }

    if (!business.deliveryRadius || business.deliveryRadius <= 0) {
      throw new Error('Delivery radius not configured - cannot calculate delivery');
    }

    // If no address configured, use default delivery fee for entire radius
    if (!business.address) {
      if (business.deliveryFee === null || business.deliveryFee === undefined) {
        throw new Error('Delivery fee not configured - please contact store to set up delivery pricing');
      }

      if (business.deliveryFee < 0) {
        throw new Error('Invalid delivery fee configuration');
      }

      return { 
        fee: business.deliveryFee,
        zone: business.deliveryFee === 0 ? 'Free Delivery' : 'Standard Delivery',
        distance: 0 // Cannot calculate distance without store address
      };
    }

    // Address is configured, calculate distance-based pricing
    if (!business.storeLatitude || !business.storeLongitude) {
      throw new Error('Store coordinates not configured - cannot calculate delivery distance');
    }

    const distanceKm = calculateDistance(
      business.storeLatitude,
      business.storeLongitude,
      customerLat,
      customerLng
    );

    // Check if within delivery radius
    if (distanceKm > business.deliveryRadius) {
      throw new Error(`Address is outside delivery area (maximum ${business.deliveryRadius}km)`);
    }

    // If no custom zones are configured, use the single delivery fee from configuration
    if (business.deliveryZones.length === 0) {
      if (business.deliveryFee === null || business.deliveryFee === undefined) {
        throw new Error('Delivery fee not configured - please contact store to set up delivery pricing');
      }

      if (business.deliveryFee < 0) {
        throw new Error('Invalid delivery fee configuration');
      }

      return { 
        fee: business.deliveryFee,
        zone: business.deliveryFee === 0 ? 'Free Delivery' : 'Standard Delivery',
        distance: Math.round(distanceKm * 100) / 100
      };
    }

    // Use custom delivery zones
    let selectedZone = null;
    for (const zone of business.deliveryZones) {
      if (distanceKm <= zone.maxDistance) {
        selectedZone = zone;
        break;
      }
    }

    if (!selectedZone) {
      selectedZone = business.deliveryZones[business.deliveryZones.length - 1];
      
      if (distanceKm > selectedZone.maxDistance) {
        throw new Error(`Address is outside all configured delivery zones (maximum ${selectedZone.maxDistance}km)`);
      }
    }

    if (selectedZone.fee === null || selectedZone.fee === undefined || selectedZone.fee < 0) {
      throw new Error(`Invalid fee configuration for ${selectedZone.name}`);
    }

    return {
      fee: selectedZone.fee,
      zone: selectedZone.name,
      distance: Math.round(distanceKm * 100) / 100
    };

  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    throw error;
  }
}

// Function to create inventory activities for order items
async function createInventoryActivities(orderId: string, businessId: string, items: any[]) {
  try {
    for (const item of items) {
      // Get current product to check if inventory tracking is enabled
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { 
          id: true, 
          name: true, 
          stock: true, 
          trackInventory: true 
        }
      });

      if (!product || !product.trackInventory) {
        console.log(`Skipping inventory tracking for product ${item.productId} - tracking disabled`);
        continue;
      }

      // Handle product inventory
      if (product.stock >= item.quantity) {
        const newStock = product.stock - item.quantity;
        
        // Update product stock
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: newStock }
        });

        // Create inventory activity for product
        await prisma.inventoryActivity.create({
          data: {
            productId: item.productId,
            businessId,
            type: 'ORDER_SALE',
            quantity: -item.quantity, // Negative because it's a sale
            oldStock: product.stock,
            newStock,
            reason: `Order sale - Order ID: ${orderId}`,
            changedBy: 'Customer Order'
          }
        });
      } else {
        console.warn(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Ordered: ${item.quantity}`);
        // Still create the activity to track the attempt
        await prisma.inventoryActivity.create({
          data: {
            productId: item.productId,
            businessId,
            type: 'ORDER_SALE',
            quantity: -item.quantity,
            oldStock: product.stock,
            newStock: Math.max(0, product.stock - item.quantity), // Don't go below 0
            reason: `Order sale - Order ID: ${orderId} (Oversold)`,
            changedBy: 'Customer Order'
          }
        });
        
        // Update to 0 if oversold
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: Math.max(0, product.stock - item.quantity) }
        });
      }

      // Handle variant inventory if applicable
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { 
            id: true, 
            name: true, 
            stock: true 
          }
        });

        if (variant) {
          const newVariantStock = Math.max(0, variant.stock - item.quantity);
          
          // Update variant stock
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: newVariantStock }
          });

          // Create inventory activity for variant
          await prisma.inventoryActivity.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              businessId,
              type: 'ORDER_SALE',
              quantity: -item.quantity,
              oldStock: variant.stock,
              newStock: newVariantStock,
              reason: `Order sale - Order ID: ${orderId} (Variant: ${variant.name})`,
              changedBy: 'Customer Order'
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error creating inventory activities:', error);
    // Don't throw error here to avoid breaking order creation
  }
}

const messageTerms = {
  en: {
    RESTAURANT: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      pickupLocation: 'Pickup Location',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      arrivalTime: 'Arrival Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP',
      orderType: 'Order Type',
      delivery_type: 'Delivery',
      pickup_type: 'Pickup',
      dineIn_type: 'Dine In'
    },
    CAFE: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      pickupLocation: 'Pickup Location',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      arrivalTime: 'Arrival Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP',
      orderType: 'Order Type',
      delivery_type: 'Delivery',
      pickup_type: 'Pickup',
      dineIn_type: 'Dine In'
    },
    RETAIL: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Shipping',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Shipping Address',
      pickupLocation: 'Pickup Location',
      deliveryTime: 'Shipping Time',
      pickupTime: 'Pickup Time',
      arrivalTime: 'Visit Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP',
      orderType: 'Order Type',
      delivery_type: 'Shipping',
      pickup_type: 'Pickup',
      dineIn_type: 'Visit'
    },
    GROCERY: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      pickupLocation: 'Pickup Location',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      arrivalTime: 'Visit Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP',
      orderType: 'Order Type',
      delivery_type: 'Delivery',
      pickup_type: 'Pickup',
      dineIn_type: 'Visit'
    },
    JEWELRY: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Shipping',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Shipping Address',
      pickupLocation: 'Store Location',
      deliveryTime: 'Shipping Time',
      pickupTime: 'Appointment Time',
      arrivalTime: 'Appointment Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP',
      orderType: 'Service Type',
      delivery_type: 'Shipping',
      pickup_type: 'Store Visit',
      dineIn_type: 'Consultation'
    },
    FLORIST: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      pickupLocation: 'Pickup Location',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      arrivalTime: 'Visit Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP',
      orderType: 'Order Type',
      delivery_type: 'Delivery',
      pickup_type: 'Pickup',
      dineIn_type: 'Visit'
    },
    HEALTH_BEAUTY: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      pickupLocation: 'Pickup Location',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Appointment Time',
      arrivalTime: 'Appointment Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP',
      orderType: 'Service Type',
      delivery_type: 'Delivery',
      pickup_type: 'Store Visit',
      dineIn_type: 'Consultation'
    },
    OTHER: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      pickupLocation: 'Pickup Location',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      arrivalTime: 'Visit Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP',
      orderType: 'Order Type',
      delivery_type: 'Delivery',
      pickup_type: 'Pickup',
      dineIn_type: 'Visit'
    }
  },
  sq: {
    RESTAURANT: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      pickupLocation: 'Vendi i Marrjes',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Marrjes',
      arrivalTime: 'Koha e Arritjes',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT',
      orderType: 'Lloji i Porosisë',
      delivery_type: 'Dorëzim',
      pickup_type: 'Marrje',
      dineIn_type: 'Në Lokal'
    },
    CAFE: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      pickupLocation: 'Vendi i Marrjes',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Marrjes',
      arrivalTime: 'Koha e Arritjes',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT',
      orderType: 'Lloji i Porosisë',
      delivery_type: 'Dorëzim',
      pickup_type: 'Marrje',
      dineIn_type: 'Në Lokal'
    },
    RETAIL: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dërgimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dërgimit',
      pickupLocation: 'Vendi i Marrjes',
      deliveryTime: 'Koha e Dërgimit',
      pickupTime: 'Koha e Marrjes',
      arrivalTime: 'Koha e Vizitës',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT',
      orderType: 'Lloji i Porosisë',
      delivery_type: 'Dërgim',
      pickup_type: 'Marrje',
      dineIn_type: 'Vizitë'
    },
    GROCERY: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      pickupLocation: 'Vendi i Marrjes',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Marrjes',
      arrivalTime: 'Koha e Vizitës',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT',
      orderType: 'Lloji i Porosisë',
      delivery_type: 'Dorëzim',
      pickup_type: 'Marrje',
      dineIn_type: 'Vizitë'
    },
    JEWELRY: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dërgimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dërgimit',
      pickupLocation: 'Vendndodhja e Dyqanit',
      deliveryTime: 'Koha e Dërgimit',
      pickupTime: 'Koha e Takimit',
      arrivalTime: 'Koha e Takimit',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT',
      orderType: 'Lloji i Shërbimit',
      delivery_type: 'Dërgim',
      pickup_type: 'Vizitë në Dyqan',
      dineIn_type: 'Konsultim'
    },
    FLORIST: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      pickupLocation: 'Vendi i Marrjes',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Marrjes',
      arrivalTime: 'Koha e Vizitës',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT',
      orderType: 'Lloji i Porosisë',
      delivery_type: 'Dorëzim',
      pickup_type: 'Marrje',
      dineIn_type: 'Vizitë'
    },
    HEALTH_BEAUTY: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      pickupLocation: 'Vendi i Marrjes',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Takimit',
      arrivalTime: 'Koha e Takimit',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT',
      orderType: 'Lloji i Shërbimit',
      delivery_type: 'Dorëzim',
      pickup_type: 'Vizitë në Dyqan',
      dineIn_type: 'Konsultim'
    },
    OTHER: {
      order: 'Porosia',
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      pickupLocation: 'Vendi i Marrjes',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Marrjes',
      arrivalTime: 'Koha e Vizitës',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT',
      orderType: 'Lloji i Porosisë',
      delivery_type: 'Dorëzim',
      pickup_type: 'Marrje',
      dineIn_type: 'Vizitë'
    }
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const orderData = await request.json()

    // Find business and check if it's closed
    const business = await prisma.business.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        currency: true,
        language: true,
        businessType: true,
        address: true,
        whatsappNumber: true,
        orderNumberFormat: true,
        website: true,
        deliveryEnabled: true,
        pickupEnabled: true,
        dineInEnabled: true,
        deliveryFee: true,
        deliveryRadius: true,
        storeLatitude: true,
        storeLongitude: true,
        isTemporarilyClosed: true,
        closureReason: true,
        closureMessage: true,
        deliveryZones: {
          where: { isActive: true },
          orderBy: { maxDistance: 'asc' }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Check if store is temporarily closed
    if (business.isTemporarilyClosed) {
      return NextResponse.json({ 
        error: 'Store is temporarily closed',
        message: business.closureMessage || 'We are temporarily closed. Please check back later.',
        reason: business.closureReason
      }, { status: 400 })
    }

    // Validate order data
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryType, // 'delivery', 'pickup', 'dineIn'
      deliveryTime,
      paymentMethod,
      specialInstructions,
      latitude,
      longitude,
      items,
      subtotal,
      deliveryFee,
      tax,
      discount,
      total
    } = orderData

    // Validate delivery type is enabled
    if (deliveryType === 'delivery' && !business.deliveryEnabled) {
      return NextResponse.json({ error: 'Delivery not available' }, { status: 400 })
    }
    if (deliveryType === 'pickup' && !business.pickupEnabled) {
      return NextResponse.json({ error: 'Pickup not available' }, { status: 400 })
    }
    if (deliveryType === 'dineIn' && !business.dineInEnabled) {
      return NextResponse.json({ error: 'Dine-in not available' }, { status: 400 })
    }

    // Validate required fields based on delivery type
    if (deliveryType === 'delivery' && (!deliveryAddress || !latitude || !longitude)) {
      return NextResponse.json({ error: 'Delivery address and coordinates required' }, { status: 400 })
    }

    // STOCK VALIDATION - Check product availability before proceeding
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { 
          id: true, 
          name: true, 
          stock: true, 
          trackInventory: true 
        }
      });

      if (!product) {
        return NextResponse.json({ 
          error: `Product not found: ${item.productId}` 
        }, { status: 400 });
      }

      // Check stock if inventory tracking is enabled
      if (product.trackInventory && product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        }, { status: 400 });
      }

      // Check variant stock if applicable
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { 
            id: true, 
            name: true, 
            stock: true 
          }
        });

        if (!variant) {
          return NextResponse.json({ 
            error: `Product variant not found: ${item.variantId}` 
          }, { status: 400 });
        }

        if (variant.stock < item.quantity) {
          return NextResponse.json({ 
            error: `Insufficient stock for ${product.name} - ${variant.name}. Available: ${variant.stock}, Requested: ${item.quantity}` 
          }, { status: 400 });
        }
      }
    }

    // Calculate and validate delivery fee for delivery orders
    let finalDeliveryFee = deliveryFee || 0
    let deliveryZone = 'Default Zone'
    let deliveryDistance = 0

    if (deliveryType === 'delivery' && latitude && longitude) {
      try {
        const deliveryResult = await calculateDeliveryFee(business.id, latitude, longitude)
        finalDeliveryFee = deliveryResult.fee
        deliveryZone = deliveryResult.zone
        deliveryDistance = deliveryResult.distance
        
        // Validate the calculated fee matches what client sent (within small tolerance)
        if (Math.abs(finalDeliveryFee - deliveryFee) > 0.01) {
          return NextResponse.json({ 
            error: 'Delivery fee mismatch',
            calculatedFee: finalDeliveryFee,
            providedFee: deliveryFee
          }, { status: 400 })
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Address is outside delivery area') {
            return NextResponse.json({ error: 'Address is outside our delivery area' }, { status: 400 })
          }
          if (error.message === 'Store is temporarily closed') {
            return NextResponse.json({ error: 'Store is temporarily closed' }, { status: 400 })
          }
        }
        // Use provided fee if calculation fails
        finalDeliveryFee = deliveryFee || business.deliveryFee
      }
    }

    // Enhanced customer creation/retrieval logic
    let customer = await prisma.customer.findFirst({
      where: {
        phone: customerPhone,
        businessId: business.id
      }
    })

    if (!customer) {
      // Customer doesn't exist, create new one with address from order
      let addressJson = null;
      let backwardCompatibleAddress = null;

      // Only set address for delivery orders
      if (deliveryType === 'delivery' && deliveryAddress) {
        addressJson = parseAndCleanAddress(deliveryAddress, latitude, longitude);
        
        // Create backward-compatible address string
        if (addressJson) {
          const addressParts = [
            addressJson.street,
            addressJson.additional,
            addressJson.city,
            addressJson.zipCode
          ].filter(Boolean);
          backwardCompatibleAddress = addressParts.join(', ');
        } else {
          backwardCompatibleAddress = deliveryAddress;
        }
      }

      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: backwardCompatibleAddress,
          addressJson: addressJson,
          businessId: business.id,
          addedByAdmin: false, // Customer created from storefront order
          tier: 'REGULAR'
        }
      })
    } else {
      // Customer exists - DO NOT update address even if different
      // Only update name and email if they've changed
      let updateData: any = {};
      
      if (customer.name !== customerName) {
        updateData.name = customerName;
      }
      
      if (customerEmail && customer.email !== customerEmail) {
        updateData.email = customerEmail;
      }
      
      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: updateData
        });
      }
    }

    // Generate order number
    const timestamp = Date.now().toString().slice(-6)
const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
const orderNumber = business.orderNumberFormat.replace('{number}', `${timestamp}${random}`)

    // Create order with enhanced data
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        type: deliveryType.toUpperCase(),
        customerId: customer.id,
        businessId: business.id,
        subtotal,
        deliveryFee: finalDeliveryFee,
        tax: tax || 0,
        discount: discount || 0,
        total,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : null,
        deliveryTime: deliveryTime ? new Date(deliveryTime) : null,
        notes: specialInstructions,
        paymentMethod,
        paymentStatus: 'PENDING',
        // Store coordinates for delivery orders
        customerLatitude: deliveryType === 'delivery' && latitude ? latitude : null,
        customerLongitude: deliveryType === 'delivery' && longitude ? longitude : null,
      }
    })

    // Create order items
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: item.price,
          modifiers: item.modifiers || []
        }
      })
    }

    // Create inventory activities for the order (after order creation)
    await createInventoryActivities(order.id, business.id, items);

    // Format WhatsApp message with enhanced pickup/delivery support
    const whatsappMessage = formatWhatsAppOrder({
      business,
      order,
      customer,
      items,
      orderData: {
        ...orderData,
        deliveryFee: finalDeliveryFee,
        deliveryZone,
        deliveryDistance,
        latitude,
        longitude
      }
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      calculatedDeliveryFee: finalDeliveryFee,
      deliveryZone,
      deliveryDistance,
      whatsappUrl: `https://wa.me/${formatWhatsAppNumber(business.whatsappNumber)}?text=${encodeURIComponent(whatsappMessage)}`
    })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

function formatWhatsAppOrder({ business, order, customer, items, orderData }: any) {
  const currencySymbol = getCurrencySymbol(business.currency)
  const language = business.language || 'en'
  const businessType = business.businessType || 'RESTAURANT'
  
  // Get appropriate terms for business type and language
  // @ts-ignore
  const terms = messageTerms[language]?.[businessType] || messageTerms['en']['RESTAURANT']
  
  let message = `*${terms.order} ${order.orderNumber}*\n\n`
  
  // Add order type prominently
  const deliveryTypeLabel = terms[`${orderData.deliveryType}_type`] || orderData.deliveryType
  message += `📋 ${terms.orderType}: *${deliveryTypeLabel}*\n\n`
  
  // Items
  items.forEach((item: any) => {
    message += `${item.quantity}x ${item.name}`
    if (item.variant) message += ` (${item.variant})`
    message += ` - ${currencySymbol}${item.price.toFixed(2)}\n`
    if (item.modifiers?.length) {
      item.modifiers.forEach((mod: any) => {
        message += `  + ${mod.name} (+${currencySymbol}${mod.price.toFixed(2)})\n`
      })
    }
  })
  
  message += `\n---\n`
  message += `${terms.subtotal}: ${currencySymbol}${orderData.subtotal.toFixed(2)}\n`
  
  if (orderData.discount > 0) {
    message += `${language === 'sq' ? 'Zbritje' : 'Discount'}: -${currencySymbol}${orderData.discount.toFixed(2)}\n`
  }
  
  if (orderData.deliveryFee > 0) {
    const deliveryLabel = orderData.deliveryZone ? `${terms.delivery} (${orderData.deliveryZone})` : terms.delivery
    message += `${deliveryLabel}: ${currencySymbol}${orderData.deliveryFee.toFixed(2)}\n`
  }
  
  message += `*${terms.total}: ${currencySymbol}${orderData.total.toFixed(2)}*\n\n`
  
  message += `---\n`
  message += `👤 ${terms.customer}: ${customer.name}\n`
  message += `📞 ${terms.phone}: ${customer.phone}\n`
  
  // Enhanced location/time handling based on delivery type
  if (orderData.deliveryType === 'delivery') {
    message += `📍 ${terms.deliveryAddress}: ${orderData.deliveryAddress}\n`
    
    // Add coordinates for delivery (helpful for delivery tracking)
    if (orderData.latitude && orderData.longitude) {
      message += `🗺️ Location: https://maps.google.com/?q=${orderData.latitude},${orderData.longitude}\n`
    }
    
    // Add distance if available
    if (orderData.deliveryDistance) {
      message += `📏 Distance: ${orderData.deliveryDistance}km\n`
    }
    
    const timeLabel = terms.deliveryTime
    message += `⏰ ${timeLabel}: ${orderData.deliveryTime ? 
      new Date(orderData.deliveryTime).toLocaleString(language === 'sq' ? 'sq-AL' : 'en-US') 
      : terms.asap}\n`
  } else if (orderData.deliveryType === 'pickup') {
    // Use business address instead of null
    const pickupAddress = business.address || 'Store location'
    message += `🏪 ${terms.pickupLocation}: ${pickupAddress}\n`
    
    const timeLabel = terms.pickupTime
    message += `⏰ ${timeLabel}: ${orderData.deliveryTime ? 
      new Date(orderData.deliveryTime).toLocaleString(language === 'sq' ? 'sq-AL' : 'en-US') 
      : terms.asap}\n`
  } else if (orderData.deliveryType === 'dineIn') {
    const dineInAddress = business.address || 'Restaurant location'
    message += `🍽️ ${dineInAddress}\n`
    
    const timeLabel = terms.arrivalTime
    message += `⏰ ${timeLabel}: ${orderData.deliveryTime ? 
      new Date(orderData.deliveryTime).toLocaleString(language === 'sq' ? 'sq-AL' : 'en-US') 
      : terms.asap}\n`
  }
  
  message += `💳 ${terms.payment}: ${orderData.paymentMethod}\n`
  
  if (orderData.specialInstructions) {
    message += `📝 ${terms.notes}: ${orderData.specialInstructions}\n`
  }
  
  message += `\n---\n`
  message += `🏪 ${business.name}\n`
  if (business.website) {
    message += `🌐 ${business.website}\n`
  }
  
  return message
}

function formatWhatsAppNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
  
  // WhatsApp API expects numbers without + prefix
  // But we need to ensure it's a valid international format
  if (cleanNumber.startsWith('1') && cleanNumber.length === 11) {
    // US number: +1XXXXXXXXXX -> 1XXXXXXXXXX
    return cleanNumber
  } else if (cleanNumber.startsWith('355') && cleanNumber.length >= 11) {
    // Albanian number: +355XXXXXXXXX -> 355XXXXXXXXX
    return cleanNumber
  } else if (cleanNumber.startsWith('30') && cleanNumber.length >= 12) {
    // Greek number: +30XXXXXXXXXX -> 30XXXXXXXXXX
    return cleanNumber
  } else if (cleanNumber.startsWith('39') && cleanNumber.length >= 11) {
    // Italian number: +39XXXXXXXXX -> 39XXXXXXXXX
    return cleanNumber
  }
  
  // For other countries, just return the clean number
  return cleanNumber
}

function getCurrencySymbol(currency: string) {
  switch (currency) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'ALL': return 'L'
    case 'GBP': return '£'
    default: return '$'
  }
}

// Delivery Fee Calculation API Route
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const { customerLat, customerLng } = await request.json()

    // Find business
    const business = await prisma.business.findUnique({
      where: { slug, isActive: true },
      select: { id: true, isTemporarilyClosed: true }
    })

    if (!business) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    if (business.isTemporarilyClosed) {
      return NextResponse.json({ error: 'Store is temporarily closed' }, { status: 400 })
    }

    const deliveryResult = await calculateDeliveryFee(business.id, customerLat, customerLng)

    return NextResponse.json({
      success: true,
      deliveryFee: deliveryResult.fee,
      zone: deliveryResult.zone,
      distance: deliveryResult.distance
    })

  } catch (error) {
    console.error('Delivery fee calculation error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Address is outside delivery area') {
        return NextResponse.json({ 
          error: 'Address is outside our delivery area' 
        }, { status: 400 })
      }
      if (error.message === 'Store is temporarily closed') {
        return NextResponse.json({ 
          error: 'Store is temporarily closed' 
        }, { status: 400 })
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to calculate delivery fee' },
      { status: 500 }
    )
  }
}