// app/api/storefront/[slug]/order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotification } from '@/lib/orderNotificationService'
import { normalizePhoneNumber, phoneNumbersMatch } from '@/lib/phone-utils'
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
      const lastPartLower = lastPart.toLowerCase();
      
      // Detect country and extract additional
      if (lastPartLower.includes('albania') || lastPartLower.includes('al')) {
        country = 'AL';
        // Extract everything after "albania"
        additional = lastPart.replace(/albania/i, '').trim();
      } else if (lastPartLower.includes('greece') || lastPartLower.includes('gr')) {
        country = 'GR';
        additional = lastPart.replace(/greece/i, '').trim();
      } else if (lastPartLower.includes('italy') || lastPartLower.includes('it')) {
        country = 'IT';
        additional = lastPart.replace(/italy/i, '').trim();
      } else if (lastPartLower.includes('spain') || lastPartLower.includes('es')) {
        country = 'ES';
        additional = lastPart.replace(/spain/i, '').trim();
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
    if (deliveryType === 'delivery' && (!deliveryAddress || !latitude || !longitude)) {
      return NextResponse.json({ error: 'Delivery address and coordinates required' }, { status: 400 })
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
    if (business.businessType === 'RETAIL' && deliveryType === 'delivery' && postalPricingId) {
      // Validate postal pricing exists and belongs to business
      // @ts-ignore - PostalPricing model will be available after Prisma generate
      const postalPricing = await (prisma as any).postalPricing.findFirst({
        where: {
          id: postalPricingId,
          businessId: business.id,
          deletedAt: null
        }
      })

      if (!postalPricing) {
        return NextResponse.json({ 
          error: 'Invalid postal pricing selected'
        }, { status: 400 })
      }

      // Use postal pricing fee
      finalDeliveryFee = postalPricing.price
      finalPostalPricingId = postalPricing.id
      deliveryZone = 'Postal Service'

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
          modifiers: modifierIds
        }
      })
    }

    // Create inventory activities for the order (after order creation)
    await createInventoryActivities(order.id, business.id, items);

  // Send order notification email
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
        businessId: business.id
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
        longitude
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
        url: request.url,
      },
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
      const discountLabel = language === 'sq' ? 'Zbritje' : 
                           language === 'es' ? 'Descuento' : 
                           'Discount'
      message += `${discountLabel}: -${currencySymbol}${orderData.discount.toFixed(2)}\n`
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
    const locale = language === 'sq' ? 'sq-AL' : 
                   language === 'es' ? 'es-ES' : 
                   'en-US'
    message += `⏰ ${timeLabel}: ${orderData.deliveryTime ? 
      new Date(orderData.deliveryTime).toLocaleString(locale) 
      : terms.asap}\n`
  } else if (orderData.deliveryType === 'pickup') {
    // Use business address instead of null
    const pickupAddress = business.address || (language === 'es' ? 'Ubicación de la tienda' : 'Store location')
    message += `🏪 ${terms.pickupLocation}: ${pickupAddress}\n`
    
    const timeLabel = terms.pickupTime
    const locale = language === 'sq' ? 'sq-AL' : 
                   language === 'es' ? 'es-ES' : 
                   'en-US'
    message += `⏰ ${timeLabel}: ${orderData.deliveryTime ? 
      new Date(orderData.deliveryTime).toLocaleString(locale) 
      : terms.asap}\n`
  } else if (orderData.deliveryType === 'dineIn') {
    const dineInAddress = business.address || (language === 'es' ? 'Ubicación del restaurante' : 'Restaurant location')
    message += `🍽️ ${dineInAddress}\n`
    
    const timeLabel = terms.arrivalTime
    const locale = language === 'sq' ? 'sq-AL' : 
                   language === 'es' ? 'es-ES' : 
                   'en-US'
    message += `⏰ ${timeLabel}: ${orderData.deliveryTime ? 
      new Date(orderData.deliveryTime).toLocaleString(locale) 
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