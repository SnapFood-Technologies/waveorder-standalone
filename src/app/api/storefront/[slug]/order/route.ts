// app/api/storefront/[slug]/order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotification } from '@/lib/orderNotificationService'
import { sendCustomerOrderPlacedEmail } from '@/lib/customer-email-notification'
import { normalizePhoneNumber, phoneNumbersMatch } from '@/lib/phone-utils'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'
import { sendOrderNotification as sendTwilioOrderNotification, isTwilioConfigured } from '@/lib/twilio'
import * as Sentry from '@sentry/nextjs'

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
  
  if (address.includes(',')) {
    const parts = address.split(',').map((part: string) => part.trim());
    
    const street = parts[0];
    
    // Extract city from parts[1]
    let city = '';
    if (parts.length >= 2) {
      let cityPart = parts[1];
      cityPart = cityPart.replace(/\b\d{3,5}\s?\d{0,2}\b/g, '').trim();
      if (cityPart) city = cityPart;
    }
    
    // Extract postal code
    let zipCode = '';
    const zipMatches = address.match(/\b\d{3,5}\s?\d{0,2}\b/g);
    if (zipMatches) {
      zipCode = zipMatches[zipMatches.length - 1].replace(/\s+/g, ' ').trim();
    }
    
    // Process the last part for country AND additional
    let country = 'US';
    let additional = '';
    
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1];
      const lastPartLower = lastPart.toLowerCase().trim();
      
      // Check if last part is just a country code (2-3 letters, no spaces, all caps or lowercase)
      const isCountryCodeOnly = /^[A-Z]{2,3}$/i.test(lastPart) && 
                                (lastPartLower === 'al' || lastPartLower === 'gr' || lastPartLower === 'it' || 
                                 lastPartLower === 'es' || lastPartLower === 'us' || lastPartLower === 'xk' || 
                                 lastPartLower === 'mk' || lastPartLower === 'gb' || lastPartLower === 'fr' ||
                                 lastPartLower === 'de' || lastPartLower === 'nl');
      
      if (isCountryCodeOnly) {
        // Last part is just a country code, no additional info
        country = lastPart.toUpperCase();
        additional = ''; // Empty because it's just the country code
      } else if (lastPartLower.includes('albania') || (lastPartLower.includes(' al') && lastPartLower.length > 3)) {
        country = 'AL';
        // Extract everything after "albania" or "al" (but only if it's not just "AL")
        const cleaned = lastPart.replace(/albania/i, '').trim();
        additional = cleaned && cleaned !== 'AL' ? cleaned : '';
      } else if (lastPartLower.includes('greece') || (lastPartLower.includes(' gr') && lastPartLower.length > 3)) {
        country = 'GR';
        const cleaned = lastPart.replace(/greece/i, '').trim();
        additional = cleaned && cleaned !== 'GR' ? cleaned : '';
      } else if (lastPartLower.includes('italy') || (lastPartLower.includes(' it') && lastPartLower.length > 3)) {
        country = 'IT';
        const cleaned = lastPart.replace(/italy/i, '').trim();
        additional = cleaned && cleaned !== 'IT' ? cleaned : '';
      } else if (lastPartLower.includes('spain') || (lastPartLower.includes(' es') && lastPartLower.length > 3)) {
        country = 'ES';
        const cleaned = lastPart.replace(/spain/i, '').trim();
        additional = cleaned && cleaned !== 'ES' ? cleaned : '';
      } else {
        // No country detected, treat entire last part as additional
        additional = lastPart;
      }
    }
    
    return {
      street,
      additional,  // ← Now properly populated
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
        continue;
      }

      // Handle variant inventory if applicable (variants have separate stock)
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
      } else {
        // Handle product inventory (only when no variant is selected)
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
      }
    }
    
    // TODO: Sync stock changes to OmniStack Gateway after order creation
    // When stock is decremented due to order placement, we should sync the updated product/variant stock back to OmniStack
    // This ensures OmniStack stays in sync with WaveOrder inventory changes from orders
    // See: /api/admin/stores/[businessId]/products/[productId]/inventory/route.ts for reference implementation

    // TODO: Sync order creation to ByBest Shop
    // When an order is created, we should sync the order data to ByBest Shop
    // This ensures ByBest Shop stays in sync with WaveOrder orders
    // import { syncOrderToByBestShop } from '@/lib/bybestshop';
    // syncOrderToByBestShop(order).catch(err => {
    //   console.error('[ByBestShop] Order sync failed:', err);
    // });
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
  },
  es: {
    RESTAURANT: {
      order: 'Pedido',
      subtotal: 'Subtotal',
      delivery: 'Entrega',
      total: 'Total',
      customer: 'Cliente',
      phone: 'Teléfono',
      deliveryAddress: 'Dirección de Entrega',
      pickupLocation: 'Ubicación de Recogida',
      deliveryTime: 'Hora de Entrega',
      pickupTime: 'Hora de Recogida',
      arrivalTime: 'Hora de Llegada',
      payment: 'Pago',
      notes: 'Notas',
      asap: 'LO ANTES POSIBLE',
      orderType: 'Tipo de Pedido',
      delivery_type: 'Entrega',
      pickup_type: 'Recogida',
      dineIn_type: 'Comer Aquí'
    },
    CAFE: {
      order: 'Pedido',
      subtotal: 'Subtotal',
      delivery: 'Entrega',
      total: 'Total',
      customer: 'Cliente',
      phone: 'Teléfono',
      deliveryAddress: 'Dirección de Entrega',
      pickupLocation: 'Ubicación de Recogida',
      deliveryTime: 'Hora de Entrega',
      pickupTime: 'Hora de Recogida',
      arrivalTime: 'Hora de Llegada',
      payment: 'Pago',
      notes: 'Notas',
      asap: 'LO ANTES POSIBLE',
      orderType: 'Tipo de Pedido',
      delivery_type: 'Entrega',
      pickup_type: 'Recogida',
      dineIn_type: 'Comer Aquí'
    },
    RETAIL: {
      order: 'Pedido',
      subtotal: 'Subtotal',
      delivery: 'Envío',
      total: 'Total',
      customer: 'Cliente',
      phone: 'Teléfono',
      deliveryAddress: 'Dirección de Envío',
      pickupLocation: 'Ubicación de Recogida',
      deliveryTime: 'Hora de Envío',
      pickupTime: 'Hora de Recogida',
      arrivalTime: 'Hora de Visita',
      payment: 'Pago',
      notes: 'Notas',
      asap: 'LO ANTES POSIBLE',
      orderType: 'Tipo de Pedido',
      delivery_type: 'Envío',
      pickup_type: 'Recogida',
      dineIn_type: 'Visita'
    },
    GROCERY: {
      order: 'Pedido',
      subtotal: 'Subtotal',
      delivery: 'Entrega',
      total: 'Total',
      customer: 'Cliente',
      phone: 'Teléfono',
      deliveryAddress: 'Dirección de Entrega',
      pickupLocation: 'Ubicación de Recogida',
      deliveryTime: 'Hora de Entrega',
      pickupTime: 'Hora de Recogida',
      arrivalTime: 'Hora de Visita',
      payment: 'Pago',
      notes: 'Notas',
      asap: 'LO ANTES POSIBLE',
      orderType: 'Tipo de Pedido',
      delivery_type: 'Entrega',
      pickup_type: 'Recogida',
      dineIn_type: 'Visita'
    },
    JEWELRY: {
      order: 'Pedido',
      subtotal: 'Subtotal',
      delivery: 'Envío',
      total: 'Total',
      customer: 'Cliente',
      phone: 'Teléfono',
      deliveryAddress: 'Dirección de Envío',
      pickupLocation: 'Ubicación de la Tienda',
      deliveryTime: 'Hora de Envío',
      pickupTime: 'Hora de Cita',
      arrivalTime: 'Hora de Cita',
      payment: 'Pago',
      notes: 'Notas',
      asap: 'LO ANTES POSIBLE',
      orderType: 'Tipo de Servicio',
      delivery_type: 'Envío',
      pickup_type: 'Visita a la Tienda',
      dineIn_type: 'Consulta'
    },
    FLORIST: {
      order: 'Pedido',
      subtotal: 'Subtotal',
      delivery: 'Entrega',
      total: 'Total',
      customer: 'Cliente',
      phone: 'Teléfono',
      deliveryAddress: 'Dirección de Entrega',
      pickupLocation: 'Ubicación de Recogida',
      deliveryTime: 'Hora de Entrega',
      pickupTime: 'Hora de Recogida',
      arrivalTime: 'Hora de Visita',
      payment: 'Pago',
      notes: 'Notas',
      asap: 'LO ANTES POSIBLE',
      orderType: 'Tipo de Pedido',
      delivery_type: 'Entrega',
      pickup_type: 'Recogida',
      dineIn_type: 'Visita'
    },
    HEALTH_BEAUTY: {
      order: 'Pedido',
      subtotal: 'Subtotal',
      delivery: 'Entrega',
      total: 'Total',
      customer: 'Cliente',
      phone: 'Teléfono',
      deliveryAddress: 'Dirección de Entrega',
      pickupLocation: 'Ubicación de Recogida',
      deliveryTime: 'Hora de Entrega',
      pickupTime: 'Hora de Cita',
      arrivalTime: 'Hora de Cita',
      payment: 'Pago',
      notes: 'Notas',
      asap: 'LO ANTES POSIBLE',
      orderType: 'Tipo de Servicio',
      delivery_type: 'Entrega',
      pickup_type: 'Visita a la Tienda',
      dineIn_type: 'Consulta'
    },
    OTHER: {
      order: 'Pedido',
      subtotal: 'Subtotal',
      delivery: 'Entrega',
      total: 'Total',
      customer: 'Cliente',
      phone: 'Teléfono',
      deliveryAddress: 'Dirección de Entrega',
      pickupLocation: 'Ubicación de Recogida',
      deliveryTime: 'Hora de Entrega',
      pickupTime: 'Hora de Recogida',
      arrivalTime: 'Hora de Visita',
      payment: 'Pago',
      notes: 'Notas',
      asap: 'LO ANTES POSIBLE',
      orderType: 'Tipo de Pedido',
      delivery_type: 'Entrega',
      pickup_type: 'Recogida',
      dineIn_type: 'Visita'
    }
  },
  el: {
    RESTAURANT: {
      order: 'Παραγγελία',
      subtotal: 'Υποσύνολο',
      delivery: 'Παράδοση',
      total: 'Σύνολο',
      customer: 'Πελάτης',
      phone: 'Τηλέφωνο',
      deliveryAddress: 'Διεύθυνση Παράδοσης',
      pickupLocation: 'Τοποθεσία Παραλαβής',
      deliveryTime: 'Ώρα Παράδοσης',
      pickupTime: 'Ώρα Παραλαβής',
      arrivalTime: 'Ώρα Άφιξης',
      payment: 'Πληρωμή',
      notes: 'Σημειώσεις',
      asap: 'ΌΣΟ ΠΙΟ ΓΡΗΓΟΡΑ',
      orderType: 'Τύπος Παραγγελίας',
      delivery_type: 'Παράδοση',
      pickup_type: 'Παραλαβή',
      dineIn_type: 'Στο Εστιατόριο'
    },
    CAFE: {
      order: 'Παραγγελία',
      subtotal: 'Υποσύνολο',
      delivery: 'Παράδοση',
      total: 'Σύνολο',
      customer: 'Πελάτης',
      phone: 'Τηλέφωνο',
      deliveryAddress: 'Διεύθυνση Παράδοσης',
      pickupLocation: 'Τοποθεσία Παραλαβής',
      deliveryTime: 'Ώρα Παράδοσης',
      pickupTime: 'Ώρα Παραλαβής',
      arrivalTime: 'Ώρα Άφιξης',
      payment: 'Πληρωμή',
      notes: 'Σημειώσεις',
      asap: 'ΌΣΟ ΠΙΟ ΓΡΗΓΟΡΑ',
      orderType: 'Τύπος Παραγγελίας',
      delivery_type: 'Παράδοση',
      pickup_type: 'Παραλαβή',
      dineIn_type: 'Στο Εστιατόριο'
    },
    RETAIL: {
      order: 'Παραγγελία',
      subtotal: 'Υποσύνολο',
      delivery: 'Αποστολή',
      total: 'Σύνολο',
      customer: 'Πελάτης',
      phone: 'Τηλέφωνο',
      deliveryAddress: 'Διεύθυνση Αποστολής',
      pickupLocation: 'Τοποθεσία Παραλαβής',
      deliveryTime: 'Ώρα Αποστολής',
      pickupTime: 'Ώρα Παραλαβής',
      arrivalTime: 'Ώρα Επίσκεψης',
      payment: 'Πληρωμή',
      notes: 'Σημειώσεις',
      asap: 'ΌΣΟ ΠΙΟ ΓΡΗΓΟΡΑ',
      orderType: 'Τύπος Παραγγελίας',
      delivery_type: 'Αποστολή',
      pickup_type: 'Παραλαβή',
      dineIn_type: 'Επίσκεψη'
    },
    GROCERY: {
      order: 'Παραγγελία',
      subtotal: 'Υποσύνολο',
      delivery: 'Παράδοση',
      total: 'Σύνολο',
      customer: 'Πελάτης',
      phone: 'Τηλέφωνο',
      deliveryAddress: 'Διεύθυνση Παράδοσης',
      pickupLocation: 'Τοποθεσία Παραλαβής',
      deliveryTime: 'Ώρα Παράδοσης',
      pickupTime: 'Ώρα Παραλαβής',
      arrivalTime: 'Ώρα Επίσκεψης',
      payment: 'Πληρωμή',
      notes: 'Σημειώσεις',
      asap: 'ΌΣΟ ΠΙΟ ΓΡΗΓΟΡΑ',
      orderType: 'Τύπος Παραγγελίας',
      delivery_type: 'Παράδοση',
      pickup_type: 'Παραλαβή',
      dineIn_type: 'Επίσκεψη'
    },
    JEWELRY: {
      order: 'Παραγγελία',
      subtotal: 'Υποσύνολο',
      delivery: 'Αποστολή',
      total: 'Σύνολο',
      customer: 'Πελάτης',
      phone: 'Τηλέφωνο',
      deliveryAddress: 'Διεύθυνση Αποστολής',
      pickupLocation: 'Τοποθεσία Καταστήματος',
      deliveryTime: 'Ώρα Αποστολής',
      pickupTime: 'Ώρα Ραντεβού',
      arrivalTime: 'Ώρα Ραντεβού',
      payment: 'Πληρωμή',
      notes: 'Σημειώσεις',
      asap: 'ΌΣΟ ΠΙΟ ΓΡΗΓΟΡΑ',
      orderType: 'Τύπος Υπηρεσίας',
      delivery_type: 'Αποστολή',
      pickup_type: 'Επίσκεψη Καταστήματος',
      dineIn_type: 'Συμβουλευτική'
    },
    FLORIST: {
      order: 'Παραγγελία',
      subtotal: 'Υποσύνολο',
      delivery: 'Παράδοση',
      total: 'Σύνολο',
      customer: 'Πελάτης',
      phone: 'Τηλέφωνο',
      deliveryAddress: 'Διεύθυνση Παράδοσης',
      pickupLocation: 'Τοποθεσία Παραλαβής',
      deliveryTime: 'Ώρα Παράδοσης',
      pickupTime: 'Ώρα Παραλαβής',
      arrivalTime: 'Ώρα Επίσκεψης',
      payment: 'Πληρωμή',
      notes: 'Σημειώσεις',
      asap: 'ΌΣΟ ΠΙΟ ΓΡΗΓΟΡΑ',
      orderType: 'Τύπος Παραγγελίας',
      delivery_type: 'Παράδοση',
      pickup_type: 'Παραλαβή',
      dineIn_type: 'Επίσκεψη'
    },
    HEALTH_BEAUTY: {
      order: 'Παραγγελία',
      subtotal: 'Υποσύνολο',
      delivery: 'Παράδοση',
      total: 'Σύνολο',
      customer: 'Πελάτης',
      phone: 'Τηλέφωνο',
      deliveryAddress: 'Διεύθυνση Παράδοσης',
      pickupLocation: 'Τοποθεσία Παραλαβής',
      deliveryTime: 'Ώρα Παράδοσης',
      pickupTime: 'Ώρα Ραντεβού',
      arrivalTime: 'Ώρα Ραντεβού',
      payment: 'Πληρωμή',
      notes: 'Σημειώσεις',
      asap: 'ΌΣΟ ΠΙΟ ΓΡΗΓΟΡΑ',
      orderType: 'Τύπος Υπηρεσίας',
      delivery_type: 'Παράδοση',
      pickup_type: 'Επίσκεψη Καταστήματος',
      dineIn_type: 'Συμβουλευτική'
    },
    OTHER: {
      order: 'Παραγγελία',
      subtotal: 'Υποσύνολο',
      delivery: 'Παράδοση',
      total: 'Σύνολο',
      customer: 'Πελάτης',
      phone: 'Τηλέφωνο',
      deliveryAddress: 'Διεύθυνση Παράδοσης',
      pickupLocation: 'Τοποθεσία Παραλαβής',
      deliveryTime: 'Ώρα Παράδοσης',
      pickupTime: 'Ώρα Παραλαβής',
      arrivalTime: 'Ώρα Επίσκεψης',
      payment: 'Πληρωμή',
      notes: 'Σημειώσεις',
      asap: 'ΌΣΟ ΠΙΟ ΓΡΗΓΟΡΑ',
      orderType: 'Τύπος Παραγγελίας',
      delivery_type: 'Παράδοση',
      pickup_type: 'Παραλαβή',
      dineIn_type: 'Επίσκεψη'
    }
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  let orderData: any = null
  let slug: string = 'unknown'
  
  try {
    slug = (await context.params).slug
    orderData = await request.json()

    // Set Sentry context for this request
    Sentry.setContext('storefront_order_request', {
      endpoint: '/api/storefront/[slug]/order',
      method: 'POST',
      slug,
    })
    Sentry.setTag('api_type', 'storefront')
    Sentry.setTag('method', 'POST')

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
        whatsappDirectNotifications: true,
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
        translateContentToBusinessLanguage: true,
        deliveryZones: {
          where: { isActive: true },
          orderBy: { maxDistance: 'asc' }
        }
      }
    })

    if (!business) {
      Sentry.setTag('error_type', 'store_not_found')
      Sentry.setTag('status_code', '404')
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Set business context for Sentry
    Sentry.setTag('business_id', business.id)
    Sentry.setTag('business_type', business.businessType)

    // Check if store is temporarily closed
    if (business.isTemporarilyClosed) {
      Sentry.setTag('error_type', 'store_closed')
      Sentry.setTag('status_code', '400')
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
      postalPricingId, // For RETAIL businesses
      countryCode, // For RETAIL businesses
      city, // For RETAIL businesses
      postalCode, // For RETAIL businesses
      items,
      subtotal,
      deliveryFee,
      tax,
      discount,
      total
    } = orderData

    // Set order context
    Sentry.setContext('order_data', {
      deliveryType: orderData.deliveryType,
      itemCount: orderData.items?.length || 0,
      total: orderData.total,
      hasCustomerEmail: !!orderData.customerEmail,
    })
    Sentry.setTag('delivery_type', orderData.deliveryType)

    // Validate required fields
    if (!customerName || !customerName.trim()) {
      Sentry.setTag('error_type', 'validation_error')
      Sentry.setTag('status_code', '400')
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }

    if (!customerPhone || !customerPhone.trim()) {
      Sentry.setTag('error_type', 'validation_error')
      Sentry.setTag('status_code', '400')
      return NextResponse.json({ error: 'Customer phone is required' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      Sentry.setTag('error_type', 'validation_error')
      Sentry.setTag('status_code', '400')
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    if (!deliveryType) {
      Sentry.setTag('error_type', 'validation_error')
      Sentry.setTag('status_code', '400')
      return NextResponse.json({ error: 'Delivery type is required' }, { status: 400 })
    }

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
    // RETAIL businesses don't need coordinates (they use postal pricing)
    // Non-RETAIL businesses need coordinates for distance calculation
    if (deliveryType === 'delivery') {
      if (!deliveryAddress) {
        return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 })
      }
      // Only require coordinates for non-RETAIL businesses
      if (business.businessType !== 'RETAIL' && (!latitude || !longitude)) {
      return NextResponse.json({ error: 'Delivery address and coordinates required' }, { status: 400 })
      }
      // For RETAIL businesses, require postal pricing selection
      if (business.businessType === 'RETAIL' && !postalPricingId) {
        return NextResponse.json({ error: 'Please select a delivery method' }, { status: 400 })
      }
    }

    // STOCK VALIDATION - Check product availability before proceeding
    for (const item of items) {
      // Validate item structure
      if (!item.productId) {
        Sentry.setTag('error_type', 'validation_error')
        Sentry.setTag('status_code', '400')
        Sentry.setContext('validation_error', { item, itemIndex: items.indexOf(item) })
        return NextResponse.json({ 
          error: 'Each item must have a product ID' 
        }, { status: 400 });
      }

      if (!item.quantity || item.quantity <= 0) {
        Sentry.setTag('error_type', 'validation_error')
        Sentry.setTag('status_code', '400')
        Sentry.setContext('validation_error', { item, itemIndex: items.indexOf(item) })
        return NextResponse.json({ 
          error: 'Each item must have a valid quantity' 
        }, { status: 400 });
      }

      if (item.price === undefined || item.price === null || item.price < 0) {
        Sentry.setTag('error_type', 'validation_error')
        Sentry.setTag('status_code', '400')
        Sentry.setContext('validation_error', { item, itemIndex: items.indexOf(item) })
        return NextResponse.json({ 
          error: 'Each item must have a valid price' 
        }, { status: 400 });
      }

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
        Sentry.setTag('error_type', 'product_not_found')
        Sentry.setTag('status_code', '400')
        Sentry.setContext('product_error', {
          productId: item.productId,
          itemIndex: items.indexOf(item),
        })
        return NextResponse.json({ 
          error: `Product not found: ${item.productId}` 
        }, { status: 400 });
      }

      // Check stock if inventory tracking is enabled
      // If variant is selected, check variant stock; otherwise check product stock
      if (product.trackInventory) {
        if (item.variantId) {
          // Check variant stock if variant is selected
          const variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId },
            select: { 
              id: true, 
              name: true, 
              stock: true 
            }
          });

          if (!variant) {
            Sentry.setTag('error_type', 'variant_not_found')
            Sentry.setTag('status_code', '400')
            Sentry.setContext('variant_error', {
              productId: item.productId,
              variantId: item.variantId,
              itemIndex: items.indexOf(item),
            })
            return NextResponse.json({ 
              error: `Product variant not found: ${item.variantId}` 
            }, { status: 400 });
          }

          if (variant.stock < item.quantity) {
            Sentry.setTag('error_type', 'insufficient_stock')
            Sentry.setTag('status_code', '400')
            Sentry.setContext('stock_error', {
              productId: item.productId,
              variantId: item.variantId,
              requested: item.quantity,
              available: variant.stock,
            })
            return NextResponse.json({ 
              error: `Insufficient stock for ${product.name} - ${variant.name}. Available: ${variant.stock}, Requested: ${item.quantity}` 
            }, { status: 400 });
          }
        } else {
          // Check product stock if no variant is selected (but tracking is enabled)
          if (product.stock < item.quantity) {
            Sentry.setTag('error_type', 'insufficient_stock')
            Sentry.setTag('status_code', '400')
            Sentry.setContext('stock_error', {
              productId: item.productId,
              requested: item.quantity,
              available: product.stock,
            })
            return NextResponse.json({ 
              error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
            }, { status: 400 });
          }
        }
      }
      // If trackInventory is false, skip stock validation (unlimited stock)
    }

    // Calculate and validate delivery fee for delivery orders
    let finalDeliveryFee = deliveryFee || 0
    let deliveryZone = 'Default Zone'
    let deliveryDistance = 0
    let finalPostalPricingId: string | null = postalPricingId || null

    // For RETAIL businesses, use postal pricing instead of distance-based calculation
    let postalPricingDetails: any = null
    if (business.businessType === 'RETAIL' && deliveryType === 'delivery' && postalPricingId) {
      // Validate postal pricing exists and belongs to business
      // @ts-ignore - PostalPricing model will be available after Prisma generate
      const allPostalPricing = await (prisma as any).postalPricing.findMany({
        where: {
          id: postalPricingId,
          businessId: business.id
        },
        include: {
          postal: {
            select: {
              id: true,
              name: true,
              nameAl: true,
              nameEl: true,
              deliveryTime: true,
              deliveryTimeAl: true,
              deliveryTimeEl: true
            }
          }
        }
      })

      // Filter out deleted records (deletedAt is null or undefined)
      const postalPricing = allPostalPricing.find((p: any) => !p.deletedAt || p.deletedAt === null)

      if (!postalPricing) {
        console.error(`Postal pricing not found - ID: ${postalPricingId}, Business: ${business.id}, Found records: ${allPostalPricing.length}`)
        return NextResponse.json({ 
          error: 'Invalid postal pricing selected'
        }, { status: 400 })
      }

      // Store postal pricing details for WhatsApp message
      // Use Albanian/Greek name if language matches, otherwise use English name
      const businessLang = business.language || 'en'
      const useAlbanianName = businessLang === 'sq'
      const useGreekName = businessLang === 'el'
      postalPricingDetails = {
        name: useAlbanianName 
          ? (postalPricing.postal?.nameAl || postalPricing.postal?.name || 'Postal Service')
          : useGreekName
            ? (postalPricing.postal?.nameEl || postalPricing.postal?.name || 'Postal Service')
            : (postalPricing.postal?.name || 'Postal Service'),
        nameEn: postalPricing.postal?.name || 'Postal Service',
        nameAl: postalPricing.postal?.nameAl || postalPricing.postal?.name || 'Postal Service',
        nameEl: postalPricing.postal?.nameEl || postalPricing.postal?.name || 'Postal Service',
        deliveryTime: useAlbanianName
          ? (postalPricing.deliveryTimeAl || postalPricing.postal?.deliveryTimeAl || postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || null)
          : useGreekName
            ? (postalPricing.deliveryTimeEl || postalPricing.postal?.deliveryTimeEl || postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || null)
            : (postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || postalPricing.deliveryTimeAl || postalPricing.postal?.deliveryTimeAl || null)
      }

      // Use postal pricing fee
      finalDeliveryFee = postalPricing.price
      finalPostalPricingId = postalPricing.id
      deliveryZone = postalPricingDetails.name

      // Validate that frontend fee matches postal pricing
      if (Math.abs(finalDeliveryFee - deliveryFee) > 0.01) {
        return NextResponse.json({ 
          error: 'Delivery fee mismatch with selected postal service',
          calculatedFee: finalDeliveryFee,
          providedFee: deliveryFee
        }, { status: 400 })
      }
    } else if (deliveryType === 'delivery' && latitude && longitude && business.businessType !== 'RETAIL') {
      // For non-RETAIL businesses, use distance-based calculation
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
        // Capture delivery fee calculation errors
        Sentry.captureException(error, {
          tags: {
            operation: 'calculate_delivery_fee',
            businessId: business.id,
            error_type: 'delivery_fee_calculation_error',
          },
          extra: {
            latitude,
            longitude,
            deliveryType,
          },
        })
        
        if (error instanceof Error) {
          if (error.message === 'Address is outside delivery area') {
            Sentry.setTag('error_type', 'outside_delivery_area')
            Sentry.setTag('status_code', '400')
            return NextResponse.json({ error: 'Address is outside our delivery area' }, { status: 400 })
          }
          if (error.message === 'Store is temporarily closed') {
            Sentry.setTag('error_type', 'store_closed')
            Sentry.setTag('status_code', '400')
            return NextResponse.json({ error: 'Store is temporarily closed' }, { status: 400 })
          }
        }
        // Use provided fee if calculation fails
        finalDeliveryFee = deliveryFee || business.deliveryFee
      }
    }

    // Enhanced customer creation/retrieval logic with normalized phone matching
    // Normalize the incoming phone number for matching
    const normalizedPhone = normalizePhoneNumber(customerPhone)
    
    if (!normalizedPhone || normalizedPhone.length < 10) {
      Sentry.setTag('error_type', 'validation_error')
      Sentry.setTag('status_code', '400')
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Find customer by matching normalized phone numbers
    // Get all customers for this business and match by normalized phone
    const allCustomers = await prisma.customer.findMany({
      where: {
        businessId: business.id
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        addressJson: true
      }
    })

    // Find customer with matching normalized phone
    let customer = allCustomers.find(c => phoneNumbersMatch(c.phone, customerPhone))

    if (!customer) {
      // Customer doesn't exist, create new one with address from order
      let addressJson = null;
      let backwardCompatibleAddress = null;

      // Only set address for delivery orders
      if (deliveryType === 'delivery' && deliveryAddress) {
        // For RETAIL businesses: Use structured fields directly, don't parse string
        if (business.businessType === 'RETAIL' && (city || countryCode || postalCode)) {
          // Extract street and additional from deliveryAddress string
          // Format for RETAIL: "street, address2, city, countryCode, postalCode"
          const parts = deliveryAddress.split(',').map((p: string) => p.trim());
          
          let street = '';
          let additional = '';
          
          // Work backwards from known fields to extract street and additional
          // We know: city, countryCode, postalCode are at the end
          // So everything before city is street + additional
          
          // Find where city starts in the string
          let streetAndAdditional = deliveryAddress;
          if (city && deliveryAddress.includes(city)) {
            // Find the last occurrence of city (in case city name appears in street)
            const cityIndex = deliveryAddress.lastIndexOf(city);
            if (cityIndex > 0) {
              streetAndAdditional = deliveryAddress.substring(0, cityIndex).trim();
              // Remove trailing comma if present
              if (streetAndAdditional.endsWith(',')) {
                streetAndAdditional = streetAndAdditional.slice(0, -1).trim();
              }
            }
          } else if (countryCode && deliveryAddress.includes(countryCode)) {
            // Fallback: use countryCode to split
            const countryIndex = deliveryAddress.lastIndexOf(countryCode);
            if (countryIndex > 0) {
              streetAndAdditional = deliveryAddress.substring(0, countryIndex).trim();
              if (streetAndAdditional.endsWith(',')) {
                streetAndAdditional = streetAndAdditional.slice(0, -1).trim();
              }
            }
          }
          
          // Split street and additional (if address2 field was provided)
          if (streetAndAdditional.includes(',')) {
            const streetParts = streetAndAdditional.split(',').map((p: string) => p.trim());
            street = streetParts[0] || '';
            // If more than one part, join the rest as additional (address2 might have commas)
            if (streetParts.length > 1) {
              additional = streetParts.slice(1).join(', ').trim();
            }
          } else {
            street = streetAndAdditional;
          }
          
          addressJson = {
            street: street,
            additional: additional,
            city: city || '',
            country: countryCode || 'US',
            zipCode: postalCode || '',
            latitude: latitude || null,
            longitude: longitude || null
          };
        } else {
          // For non-RETAIL businesses: Use existing parsing logic
        addressJson = parseAndCleanAddress(deliveryAddress, latitude, longitude);
        }
        
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
          phone: customerPhone.trim(), // Store original format for display
          email: customerEmail?.trim() || null,
          address: backwardCompatibleAddress,
          addressJson: addressJson,
          businessId: business.id,
          addedByAdmin: false, // Customer created from storefront order
          tier: 'REGULAR'
        }
      })
    } else {
      // Customer exists - Update with most recent information
      // Strategy: Always update name/email if different (customer knows their info best)
      // Update address if it's a delivery order and address is different or missing
      let updateData: any = {};
      
      // Update name if different (trust the most recent order)
      const currentName = customer.name?.trim() || ''
      const newName = customerName?.trim() || ''
      if (newName && newName !== currentName) {
        updateData.name = newName;
      }
      
      // Update email if provided and different (prefer non-null email)
      if (customerEmail?.trim()) {
        const currentEmail = customer.email?.trim() || ''
        const newEmail = customerEmail.trim()
        if (newEmail !== currentEmail) {
          updateData.email = newEmail;
        }
      }
      
      // Update address if delivery order and address is provided
      if (deliveryType === 'delivery' && deliveryAddress) {
        let addressJson = null;
        let backwardCompatibleAddress = null;
        
        // For RETAIL businesses: Use structured fields directly, don't parse string
        if (business.businessType === 'RETAIL' && (city || countryCode || postalCode)) {
          // Extract street and additional from deliveryAddress string
          // Format for RETAIL: "street, address2, city, countryCode, postalCode"
          const parts = deliveryAddress.split(',').map((p: string) => p.trim());
          
          let street = '';
          let additional = '';
          
          // Work backwards from known fields to extract street and additional
          // Find where city starts in the string
          let streetAndAdditional = deliveryAddress;
          if (city && deliveryAddress.includes(city)) {
            const cityIndex = deliveryAddress.lastIndexOf(city);
            if (cityIndex > 0) {
              streetAndAdditional = deliveryAddress.substring(0, cityIndex).trim();
              if (streetAndAdditional.endsWith(',')) {
                streetAndAdditional = streetAndAdditional.slice(0, -1).trim();
              }
            }
          } else if (countryCode && deliveryAddress.includes(countryCode)) {
            const countryIndex = deliveryAddress.lastIndexOf(countryCode);
            if (countryIndex > 0) {
              streetAndAdditional = deliveryAddress.substring(0, countryIndex).trim();
              if (streetAndAdditional.endsWith(',')) {
                streetAndAdditional = streetAndAdditional.slice(0, -1).trim();
              }
            }
          }
          
          // Split street and additional (address2 might have commas)
          if (streetAndAdditional.includes(',')) {
            const streetParts = streetAndAdditional.split(',').map((p: string) => p.trim());
            street = streetParts[0] || '';
            if (streetParts.length > 1) {
              additional = streetParts.slice(1).join(', ').trim();
            }
          } else {
            street = streetAndAdditional;
          }
          
          addressJson = {
            street: street,
            additional: additional,
            city: city || '',
            country: countryCode || 'US',
            zipCode: postalCode || '',
            latitude: latitude || null,
            longitude: longitude || null
          };
        } else {
          // For non-RETAIL businesses: Use existing parsing logic
          addressJson = parseAndCleanAddress(deliveryAddress, latitude, longitude);
        }
        
        if (addressJson) {
          const addressParts = [
            addressJson.street,
            addressJson.additional,
            addressJson.city,
            addressJson.zipCode
          ].filter(Boolean);
          backwardCompatibleAddress = addressParts.join(', ');
          
          // Check if address is different from current address
          const currentAddress = customer.address?.trim() || ''
          const currentAddressJson = customer.addressJson ? (typeof customer.addressJson === 'string' ? JSON.parse(customer.addressJson) : customer.addressJson) : null
          
          // Update if:
          // 1. Customer has no address stored, OR
          // 2. The new address is significantly different (different street or city)
          const shouldUpdateAddress = !currentAddress || 
            !currentAddressJson ||
            !currentAddressJson.street ||
            currentAddressJson.street.toLowerCase().trim() !== addressJson.street.toLowerCase().trim() ||
            (addressJson.city && currentAddressJson.city && 
             currentAddressJson.city.toLowerCase().trim() !== addressJson.city.toLowerCase().trim())
          
          if (shouldUpdateAddress) {
            updateData.address = backwardCompatibleAddress;
            updateData.addressJson = addressJson;
          }
        } else {
          // Fallback: use delivery address as-is if parsing fails
          const currentAddress = customer.address?.trim() || ''
          if (!currentAddress || currentAddress !== deliveryAddress.trim()) {
            updateData.address = deliveryAddress.trim();
          }
        }
      }
      
      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: updateData
        });
        
        // Refresh customer data
        customer = await prisma.customer.findUnique({
          where: { id: customer.id },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            addressJson: true
          }
        }) || customer
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
        customerName: customerName || customer.name || '', // Store customer name at order creation time
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
        // Store postal pricing for RETAIL businesses
        // @ts-ignore - postalPricingId field will be available after Prisma generate
        postalPricingId: finalPostalPricingId,
      } as any
    })

    // Create order items
    for (const item of items) {
      // Transform modifiers from objects to IDs (strings)
      const modifierIds = item.modifiers?.map((mod: any) => {
        // Handle both object format {id, name, price} and string ID format
        return typeof mod === 'string' ? mod : mod.id
      }) || []
      
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: item.price,
          originalPrice: (item as any).originalPrice || null,
          modifiers: modifierIds
        }
      })
    }

    // Create inventory activities for the order (after order creation)
    await createInventoryActivities(order.id, business.id, items);

  // Send customer order placed confirmation email (if customer has email)
  try {
    if (customer.email && customer.email.trim()) {
      // Get order items with product details for email
      const orderItemsForCustomerEmail = await prisma.orderItem.findMany({
        where: { orderId: order.id },
        include: {
          product: { select: { name: true } },
          variant: { select: { name: true } }
        }
      })

      // Fetch postal pricing details if it exists (for RETAIL businesses)
      let postalPricingDetails: any = null
      // @ts-ignore - postalPricingId field will be available after Prisma generate
      const orderPostalPricingId = (order as any).postalPricingId
      if (business.businessType === 'RETAIL' && orderPostalPricingId) {
        try {
          // @ts-ignore - PostalPricing model will be available after Prisma generate
          const postalPricing = await (prisma as any).postalPricing.findUnique({
            where: { id: orderPostalPricingId },
            include: {
              postal: {
                select: {
                  name: true,
                  nameAl: true,
                  nameEl: true,
                  deliveryTime: true,
                  deliveryTimeAl: true,
                  deliveryTimeEl: true
                }
              }
            }
          })

          if (postalPricing) {
            const isAlbanian = business.language === 'sq' || business.language === 'al'
            const isGreek = business.language === 'el'
            postalPricingDetails = {
              name: isAlbanian
                ? (postalPricing.postal?.nameAl || postalPricing.postal?.name || 'Postal Service')
                : isGreek
                  ? (postalPricing.postal?.nameEl || postalPricing.postal?.name || 'Postal Service')
                  : (postalPricing.postal?.name || 'Postal Service'),
              nameEn: postalPricing.postal?.name || 'Postal Service',
              nameAl: postalPricing.postal?.nameAl || postalPricing.postal?.name || 'Postal Service',
              nameEl: postalPricing.postal?.nameEl || postalPricing.postal?.name || 'Postal Service',
              deliveryTime: isAlbanian
                ? (postalPricing.deliveryTimeAl || postalPricing.postal?.deliveryTimeAl || postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || null)
                : isGreek
                  ? (postalPricing.deliveryTimeEl || postalPricing.postal?.deliveryTimeEl || postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || null)
                  : (postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || postalPricing.deliveryTimeAl || postalPricing.postal?.deliveryTimeAl || null),
              price: postalPricing.price
            }
          }
        } catch (error) {
          console.error('Error fetching postal pricing details for customer email:', error)
        }
      }

      // For RETAIL: Use structured fields directly from request (don't parse string)
      // These fields come directly from the customer's form input
      // Priority: Use structured fields from request > fallback to extraction if missing
      let finalCity = city || null
      let finalCountryCode = countryCode || null
      let finalPostalCode = postalCode || null
      
      // Only try extraction if structured fields are missing (fallback)
      if (business.businessType === 'RETAIL' && order.deliveryAddress && (!finalCity || !finalCountryCode)) {
        // Format: "street, address2, city, countryCode, postalCode"
        // Work backwards from known patterns
        const addressParts = order.deliveryAddress.split(',').map((p: string) => p.trim())
        
        // Check last part for postal code (numeric)
        if (!finalPostalCode && addressParts.length > 0) {
          const lastPart = addressParts[addressParts.length - 1]
          if (/^\d{3,6}$/.test(lastPart)) {
            finalPostalCode = lastPart
          }
        }
        
        // Check last or second-to-last for country code (2-3 letter code)
        if (!finalCountryCode && addressParts.length > 0) {
          // Try last part first
          const lastPart = addressParts[addressParts.length - 1].toUpperCase()
          if (/^[A-Z]{2,3}$/.test(lastPart) && 
              (lastPart === 'AL' || lastPart === 'XK' || lastPart === 'MK' || 
               lastPart === 'GR' || lastPart === 'IT' || lastPart === 'ES' || 
               lastPart === 'US' || lastPart === 'GB' || lastPart === 'FR' || 
               lastPart === 'DE' || lastPart === 'NL')) {
            finalCountryCode = lastPart
          }
          // If last part was postal code, try second-to-last for country code
          else if (addressParts.length > 1) {
            const secondLast = addressParts[addressParts.length - 2].toUpperCase()
            if (/^[A-Z]{2,3}$/.test(secondLast) && 
                (secondLast === 'AL' || secondLast === 'XK' || secondLast === 'MK' || 
                 secondLast === 'GR' || secondLast === 'IT' || secondLast === 'ES' || 
                 secondLast === 'US' || secondLast === 'GB' || secondLast === 'FR' || 
                 secondLast === 'DE' || secondLast === 'NL')) {
              finalCountryCode = secondLast
            }
          }
        }
        
        // If we found country code, city should be the part immediately before it
        if (!finalCity && finalCountryCode && addressParts.length > 1) {
          const countryIndex = addressParts.findIndex(p => p.toUpperCase() === finalCountryCode)
          if (countryIndex > 0) {
            finalCity = addressParts[countryIndex - 1]
          }
        }
      }

      // Send customer order placed email
      sendCustomerOrderPlacedEmail(
        {
          name: customer.name,
          email: customer.email
        },
        {
          orderNumber: order.orderNumber,
          status: order.status,
          type: order.type,
          total: order.total,
          deliveryAddress: order.deliveryAddress || undefined,
          businessName: business.name,
          businessAddress: business.address || undefined,
          businessPhone: business.whatsappNumber || undefined,
          currency: business.currency,
          language: business.language || 'en',
          translateContentToBusinessLanguage: business.translateContentToBusinessLanguage ?? true,
          businessType: business.businessType || undefined,
          items: orderItemsForCustomerEmail.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
            originalPrice: (item as any).originalPrice || null,
            variant: item.variant?.name || null
          })),
          postalPricingDetails: postalPricingDetails,
          countryCode: finalCountryCode || undefined,
          city: finalCity || undefined,
          postalCode: finalPostalCode || undefined
        }
      ).catch((error) => {
        // Log error but don't fail the request
        Sentry.captureException(error, {
          tags: {
            operation: 'send_customer_order_placed_email',
            businessId: business.id,
          },
          extra: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerId: customer.id,
          },
        })
        console.error('Failed to send customer order placed email:', error)
      })
    }
  } catch (emailError) {
    // Don't fail order creation if customer email fails
    Sentry.captureException(emailError, {
      tags: {
        operation: 'send_customer_order_placed_email_error',
        businessId: business.id,
      },
      extra: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    })
    console.error('Customer order placed email failed:', emailError)
  }

  // Send order notification email to business
try {
  // First, get business notification settings
  const businessWithNotifications = await prisma.business.findUnique({
    where: { id: business.id },
    select: {
      orderNotificationsEnabled: true,
      orderNotificationEmail: true,
      email: true
    }
  })

  if (businessWithNotifications?.orderNotificationsEnabled) {
    // Get order items with product details for email
    const orderItemsForEmail = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      include: {
        product: { select: { name: true } },
        variant: { select: { name: true } }
      }
    })

    // Fetch postal pricing details if it exists (for RETAIL businesses)
    let postalPricingDetails: any = null
    // @ts-ignore - postalPricingId field will be available after Prisma generate
    const orderPostalPricingId = (order as any).postalPricingId
    if (business.businessType === 'RETAIL' && orderPostalPricingId) {
      try {
        // @ts-ignore - PostalPricing model will be available after Prisma generate
        const postalPricing = await (prisma as any).postalPricing.findUnique({
          where: { id: orderPostalPricingId },
          include: {
            postal: {
              select: {
                name: true,
                nameAl: true,
                nameEl: true,
                deliveryTime: true,
                deliveryTimeAl: true,
                deliveryTimeEl: true
              }
            }
          }
        })

        if (postalPricing) {
          const isAlbanian = business.language === 'sq' || business.language === 'al'
          const isGreek = business.language === 'el'
          postalPricingDetails = {
            name: isAlbanian
              ? (postalPricing.postal?.nameAl || postalPricing.postal?.name || 'Postal Service')
              : isGreek
                ? (postalPricing.postal?.nameEl || postalPricing.postal?.name || 'Postal Service')
                : (postalPricing.postal?.name || 'Postal Service'),
            nameEn: postalPricing.postal?.name || 'Postal Service',
            nameAl: postalPricing.postal?.nameAl || postalPricing.postal?.name || 'Postal Service',
            nameEl: postalPricing.postal?.nameEl || postalPricing.postal?.name || 'Postal Service',
            deliveryTime: isAlbanian
              ? (postalPricing.deliveryTimeAl || postalPricing.postal?.deliveryTimeAl || postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || null)
              : isGreek
                ? (postalPricing.deliveryTimeEl || postalPricing.postal?.deliveryTimeEl || postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || null)
                : (postalPricing.deliveryTime || postalPricing.postal?.deliveryTime || postalPricing.deliveryTimeAl || postalPricing.postal?.deliveryTimeAl || null),
            price: postalPricing.price
          }
        }
      } catch (error) {
        console.error('Error fetching postal pricing details for email:', error)
      }
    }

    // Call the order notification service
    await sendOrderNotification(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        type: order.type,
        total: order.total,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        customer: { name: customer.name, phone: customer.phone },
        items: orderItemsForEmail,
        businessId: business.id,
        postalPricingDetails: postalPricingDetails,
        countryCode: countryCode || null,
        city: city || null,
        postalCode: postalCode || null
      },
      {
        name: business.name,
        orderNotificationsEnabled: businessWithNotifications.orderNotificationsEnabled,
        orderNotificationEmail: businessWithNotifications.orderNotificationEmail,
        email: businessWithNotifications.email,
        currency: business.currency,
        businessType: business.businessType,
        language: business.language
      }
    )
  }
  } catch (emailError) {
    // Don't fail order creation if email fails
    Sentry.captureException(emailError, {
      tags: {
        operation: 'send_order_notification',
        businessId: business.id,
      },
      extra: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    })
    console.error('Order notification email failed:', emailError)
  }


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
        longitude,
        postalPricingDetails, // Include postal pricing details for RETAIL
        countryCode: orderData.countryCode, // Include country code for localization
        postalCode: orderData.postalCode // Include postal code
      }
    })

    // Set success context
    Sentry.setTag('order_created', 'true')
    Sentry.setTag('order_id', order.id)
    Sentry.setContext('order_success', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      deliveryType: order.type,
    })

    // Log successful order creation
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined
    
    // Construct actual public URL from headers (not internal fetch URL which may show localhost)
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}${new URL(request.url).search}` : request.url
    
    logSystemEvent({
      logType: 'order_created',
      severity: 'info',
      slug,
      businessId: business.id,
      endpoint: '/api/storefront/[slug]/order',
      method: 'POST',
      statusCode: 200,
      ipAddress,
      userAgent,
      referrer,
      url: actualUrl,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: customer.id,
        customerName: customerName || customer.name,
        orderType: order.type,
        itemCount: items.length,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        paymentMethod: paymentMethod,
        deliveryAddress: order.deliveryAddress || null,
        hasEmail: !!customer.email,
      }
    })

    // Check if direct WhatsApp notifications are enabled via Twilio
    const useDirectNotification = business.whatsappDirectNotifications && isTwilioConfigured()
    let twilioMessageSent = false
    let twilioError: string | undefined

    if (useDirectNotification) {
      // Fetch order items with product details for Twilio message
      const orderItemsForTwilio = await prisma.orderItem.findMany({
        where: { orderId: order.id },
        include: {
          product: { select: { name: true } },
          variant: { select: { name: true } }
        }
      })

      // Send order notification directly to business via Twilio
      const twilioResult = await sendTwilioOrderNotification(
        business.whatsappNumber,
        {
          orderNumber: order.orderNumber,
          businessName: business.name,
          businessSlug: business.slug,
          customerName: customer.name,
          customerPhone: customer.phone || orderData.customerPhone,
          items: orderItemsForTwilio.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant?.name
          })),
          subtotal: order.subtotal,
          deliveryFee: finalDeliveryFee,
          total: order.total,
          deliveryType: order.type.toLowerCase() as 'delivery' | 'pickup' | 'dineIn',
          deliveryAddress: order.deliveryAddress || undefined,
          deliveryTime: orderData.deliveryTime || null,
          specialInstructions: order.notes || undefined,
          currencySymbol: getCurrencySymbol(business.currency)
        }
      )

      twilioMessageSent = twilioResult.success
      if (!twilioResult.success) {
        twilioError = twilioResult.error
        console.error('Twilio notification failed:', twilioResult.error)
        // Log the failure but don't fail the order
        Sentry.captureMessage('Twilio order notification failed', {
          level: 'warning',
          extra: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            businessId: business.id,
            error: twilioResult.error
          }
        })
      }
    }

    // Return response based on notification type
    if (useDirectNotification && twilioMessageSent) {
      // Direct notification sent successfully - no wa.me redirect needed
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        calculatedDeliveryFee: finalDeliveryFee,
        deliveryZone,
        deliveryDistance,
        directNotification: true,
        message: 'Order sent! The business has been notified.'
      })
    } else {
      // Use traditional wa.me redirect (either by preference or as fallback)
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        calculatedDeliveryFee: finalDeliveryFee,
        deliveryZone,
        deliveryDistance,
        directNotification: false,
        whatsappUrl: `https://wa.me/${formatWhatsAppNumber(business.whatsappNumber)}?text=${encodeURIComponent(whatsappMessage)}`
      })
    }

  } catch (error) {
    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'storefront_order_post',
        method: 'POST',
        error_type: 'order_creation_error',
      },
      extra: {
        slug,
        orderData: orderData ? {
          deliveryType: orderData.deliveryType,
          itemCount: orderData.items?.length,
          hasCustomerEmail: !!orderData.customerEmail,
        } : null,
      },
    })
    
    // Log order creation error
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined
    const businessId = orderData?.businessId || undefined
    
    // Construct actual public URL from headers (not internal fetch URL which may show localhost)
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}${new URL(request.url).search}` : request.url
    
    logSystemEvent({
      logType: 'order_error',
      severity: 'error',
      slug,
      businessId,
      endpoint: '/api/storefront/[slug]/order',
      method: 'POST',
      statusCode: error instanceof Error && error.message.includes('required') ? 400 : 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      ipAddress,
      userAgent,
      referrer,
      url: actualUrl,
      metadata: {
        errorType: 'order_creation_error',
        orderData: orderData ? {
          deliveryType: orderData.deliveryType,
          itemCount: orderData.items?.length,
          hasCustomerEmail: !!orderData.customerEmail,
        } : null,
      }
    })
    
    console.error('Order creation error:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      // Check for common validation errors
      if (error.message.includes('required') || error.message.includes('missing')) {
        return NextResponse.json(
          { error: `Validation error: ${error.message}` },
          { status: 400 }
        )
      }
      
      // Check for database constraint errors
      if (error.message.includes('Unique constraint') || error.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'An order with this information already exists. Please try again.' },
          { status: 409 }
        )
      }
      
      // Check for invalid data errors
      if (error.message.includes('Invalid') || error.message.includes('invalid')) {
        return NextResponse.json(
          { error: `Invalid data: ${error.message}` },
          { status: 400 }
        )
      }
      
      // Return the error message if it's informative
      if (error.message && error.message.length < 200) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
    }
    
    // Generic fallback error
    return NextResponse.json(
      { 
        error: 'Failed to create order. Please check your information and try again.'
      },
      { status: 500 }
    )
  }
}

function formatWhatsAppOrder({ business, order, customer, items, orderData }: any) {
  const currencySymbol = getCurrencySymbol(business.currency)
  // Use business language if translation is enabled, otherwise default to English
  const useBusinessLanguage = business.translateContentToBusinessLanguage !== false
  const language = useBusinessLanguage ? (business.language || 'en') : 'en'
  const businessType = business.businessType || 'RESTAURANT'
  
  // Get appropriate terms for business type and language
  // @ts-ignore
  const terms = messageTerms[language]?.[businessType] || messageTerms['en']['RESTAURANT']
  
  let message = `*${terms.order} ${order.orderNumber}*\n\n`
  
  // Add order type prominently
  const deliveryTypeLabel = terms[`${orderData.deliveryType}_type`] || orderData.deliveryType
  message += `${terms.orderType}: *${deliveryTypeLabel}*\n\n`
  
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
      const discountLabel = language === 'sq' ? 'Zbritje' : 
                           language === 'es' ? 'Descuento' : 
                           'Discount'
      message += `${discountLabel}: -${currencySymbol}${orderData.discount.toFixed(2)}\n`
    }
  
  if (orderData.deliveryFee > 0) {
    // For RETAIL, show postal service name; for others, show delivery zone
    let deliveryLabel = terms.delivery
    if (businessType === 'RETAIL' && orderData.postalPricingDetails) {
      deliveryLabel = `${terms.delivery} (${orderData.postalPricingDetails.name})`
    } else if (orderData.deliveryZone) {
      deliveryLabel = `${terms.delivery} (${orderData.deliveryZone})`
    }
    message += `${deliveryLabel}: ${currencySymbol}${orderData.deliveryFee.toFixed(2)}\n`
  }
  
  message += `*${terms.total}: ${currencySymbol}${orderData.total.toFixed(2)}*\n\n`
  
  message += `---\n`
  message += `${terms.customer}: ${customer.name}\n`
  message += `${terms.phone}: ${customer.phone}\n`
  
  // Enhanced location/time handling based on delivery type
  if (orderData.deliveryType === 'delivery') {
    // Format delivery address with localized country and postal code
    let formattedAddress = orderData.deliveryAddress || ''
    
    // Localize country code if present
    if (orderData.countryCode) {
      const countryNames: Record<string, Record<string, string>> = {
        'AL': {
          'sq': 'Shqipëri',
          'en': 'Albania',
          'es': 'Albania',
          'el': 'Αλβανία'
        },
        'XK': {
          'sq': 'Kosovë',
          'en': 'Kosovo',
          'es': 'Kosovo',
          'el': 'Κοσσυφοπέδιο'
        },
        'MK': {
          'sq': 'Maqedonia e Veriut',
          'en': 'North Macedonia',
          'es': 'Macedonia del Norte',
          'el': 'Βόρεια Μακεδονία'
        },
        'GR': {
          'sq': 'Greqia',
          'en': 'Greece',
          'es': 'Grecia',
          'el': 'Ελλάδα'
        }
      }
      
      const localizedCountry = countryNames[orderData.countryCode]?.[language] || orderData.countryCode
      
      // Replace country code with localized name in address
      formattedAddress = formattedAddress.replace(/\b(AL|XK|MK)\b/g, localizedCountry)
      
      // Add postal code if provided and not already in address
      if (orderData.postalCode && !formattedAddress.includes(orderData.postalCode)) {
        formattedAddress += `, ${orderData.postalCode}`
      }
    } else if (orderData.postalCode && !formattedAddress.includes(orderData.postalCode)) {
      // Add postal code even if no country code
      formattedAddress += `, ${orderData.postalCode}`
    }
    
    message += `${terms.deliveryAddress}: ${formattedAddress}\n`
    
    // Add coordinates for delivery (helpful for delivery tracking) - only for non-RETAIL
    if (orderData.latitude && orderData.longitude && businessType !== 'RETAIL') {
      message += `Location: https://maps.google.com/?q=${orderData.latitude},${orderData.longitude}\n`
    }
    
    // Add distance if available (only for non-RETAIL)
    if (orderData.deliveryDistance && businessType !== 'RETAIL') {
      message += `Distance: ${orderData.deliveryDistance}km\n`
    }
    
    // Delivery time with postal pricing details for RETAIL
    const timeLabel = terms.deliveryTime
    if (businessType === 'RETAIL' && orderData.postalPricingDetails) {
      // For RETAIL: Only show postal service with delivery time (no separate "Delivery Time" line)
      const postalServiceName = orderData.postalPricingDetails.name || 'Postal Service'
      const deliveryTimeText = orderData.postalPricingDetails.deliveryTime || terms.asap
      message += `${postalServiceName}: ${deliveryTimeText}\n`
    } else {
      // For non-RETAIL: Standard delivery time
    const locale = language === 'sq' ? 'sq-AL' : 
                   language === 'es' ? 'es-ES' : 
                   language === 'el' ? 'el-GR' :
                   'en-US'
    message += `${timeLabel}: ${orderData.deliveryTime ? 
      new Date(orderData.deliveryTime).toLocaleString(locale) 
      : terms.asap}\n`
    }
  } else if (orderData.deliveryType === 'pickup') {
    // Use business address instead of null
    const pickupAddress = business.address || (language === 'es' ? 'Ubicación de la tienda' : 'Store location')
    message += `${terms.pickupLocation}: ${pickupAddress}\n`
    
    const timeLabel = terms.pickupTime
    const locale = language === 'sq' ? 'sq-AL' : 
                   language === 'es' ? 'es-ES' : 
                   language === 'el' ? 'el-GR' :
                   'en-US'
    message += `${timeLabel}: ${orderData.deliveryTime ? 
      new Date(orderData.deliveryTime).toLocaleString(locale) 
      : terms.asap}\n`
  } else if (orderData.deliveryType === 'dineIn') {
    const dineInAddress = business.address || (language === 'es' ? 'Ubicación del restaurante' : 'Restaurant location')
    message += `${dineInAddress}\n`
    
    const timeLabel = terms.arrivalTime
    const locale = language === 'sq' ? 'sq-AL' : 
                   language === 'es' ? 'es-ES' : 
                   language === 'el' ? 'el-GR' :
                   'en-US'
    message += `${timeLabel}: ${orderData.deliveryTime ? 
      new Date(orderData.deliveryTime).toLocaleString(locale) 
      : terms.asap}\n`
  }
  
  message += `${terms.payment}: ${orderData.paymentMethod}\n`
  
  if (orderData.specialInstructions) {
    message += `${terms.notes}: ${orderData.specialInstructions}\n`
  }
  
  message += `\n---\n`
  message += `${business.name}\n`
  if (business.website) {
    message += `${business.website}\n`
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
  } else if (cleanNumber.startsWith('34') && cleanNumber.length >= 11) {
    // Spanish number: +34XXXXXXXXX -> 34XXXXXXXXX
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
    case 'BHD': return 'BD'
    case 'BBD': return 'Bds$'
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