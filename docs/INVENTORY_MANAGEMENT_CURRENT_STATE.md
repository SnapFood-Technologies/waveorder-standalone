# Inventory/Stock Management - Current State

> **Status**: Complete  
> **Last Updated**: January 2026  
> **Reviewer**: Griseld (2)

## Summary

WaveOrder has a comprehensive inventory management system with stock tracking, stock reservation for pending orders, low stock alerts, activity logging, and full admin controls. The system supports both product-level and variant-level stock tracking with automatic updates on order events.

---

## What We Have

### Database Models

**Product Model** (`prisma/schema.prisma`):
```prisma
stock                      Int      @default(0)    // Current stock level
reservedStock              Int      @default(0)    // Stock reserved for pending orders
trackInventory             Boolean  @default(true) // Enable/disable tracking
lowStockAlert              Int?                    // Threshold for alerts
enableLowStockNotification Boolean  @default(false) // Enable email notifications
```

**ProductVariant Model**:
```prisma
stock         Int @default(0)  // Variant-specific stock
reservedStock Int @default(0)  // Reserved for pending orders
```

**InventoryActivity Model**:
```prisma
model InventoryActivity {
  id         String
  productId  String
  variantId  String?           // Optional for variant-level tracking
  businessId String
  type       InventoryChangeType
  quantity   Int               // Amount changed
  oldStock   Int
  newStock   Int
  reason     String?
  changedBy  String?           // User ID or "system"
  createdAt  DateTime
}
```

**InventoryChangeType Enum**:
- `MANUAL_INCREASE` - Manual stock increase
- `MANUAL_DECREASE` - Manual stock decrease
- `ORDER_SALE` - Stock sold via order
- `RESTOCK` - Bulk restocking
- `ADJUSTMENT` - General adjustment
- `LOSS` - Loss/damage
- `RETURN` - Stock returned (order cancellation)

---

## Features

### Stock Reservation System
| Feature | Status |
|---------|--------|
| Reserve stock on order creation | ✅ |
| Release reserved stock on cancellation | ✅ |
| Commit reserved stock on completion | ✅ |
| Check stock availability (actual - reserved) | ✅ |
| Prevent overselling | ✅ |

### Admin Features
| Feature | Status |
|---------|--------|
| Inventory Dashboard with metrics | ✅ |
| Stock adjustments with reasons | ✅ |
| Inventory activity log | ✅ |
| Low stock alerts list | ✅ |
| Product form stock controls | ✅ |
| Low stock filter in products | ✅ |
| Stock status badges | ✅ |

### Automatic Stock Updates
| Event | Action | Activity Type |
|-------|--------|---------------|
| Order placed | Stock reserved | - |
| Order confirmed | Stock remains reserved | - |
| Order completed | Reserved → Actual deduction | `ORDER_SALE` |
| Order cancelled | Reserved stock released | `RETURN` |
| Admin adjustment | Stock updated | `MANUAL_INCREASE`/`MANUAL_DECREASE` |

---

## Stock Reservation Library

**Location**: `src/lib/stock-reservation.ts`

### Functions
```typescript
// Reserve stock for order items
reserveStock(items: OrderItem[]): Promise<{ success: boolean; error?: string }>

// Release reserved stock (cancellation)
releaseReservedStock(items: OrderItem[]): Promise<void>

// Commit reserved stock (completion)
commitReservedStock(items: OrderItem[], businessId: string): Promise<void>

// Get available stock (stock - reservedStock)
getAvailableStock(stock: number, reservedStock: number): number

// Check if all items are available
checkStockAvailability(items: OrderItem[]): Promise<{ available: boolean; unavailableItems: [] }>
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stores/[businessId]/inventory/dashboard` | GET | Dashboard stats |
| `/api/admin/stores/[businessId]/products/[productId]/inventory` | GET | Product inventory activities |
| `/api/admin/stores/[businessId]/products/[productId]/inventory` | POST | Adjust stock |
| `/api/admin/stores/[businessId]/inventory/activities` | GET | All inventory activities |
| `/api/admin/stores/[businessId]/orders/[orderId]/revert-stock` | POST | Restore stock |
| `/api/cron/low-stock-alerts` | GET | Cron job for email alerts |

---

## Low Stock Alerts & Notifications

### Alert Configuration
- Per-product `lowStockAlert` threshold
- `enableLowStockNotification` flag per product
- Dashboard displays low stock products

### Email Notifications
- Cron job sends alerts to business owners
- Email includes: product name, SKU, current stock, threshold

---

## Files Reference

| Purpose | Path |
|---------|------|
| Schema | `prisma/schema.prisma` |
| Stock Reservation Library | `src/lib/stock-reservation.ts` |
| Dashboard Component | `src/components/admin/inventory/InventoryDashboard.tsx` |
| Activity Component | `src/components/admin/inventory/InventoryActivity.tsx` |
| Adjustments Component | `src/components/admin/inventory/StockAdjustmentsComponent.tsx` |
| Product Form | `src/components/admin/products/ProductForm.tsx` |
| Products List | `src/components/admin/products/ProductsManagement.tsx` |
| Dashboard API | `src/app/api/admin/stores/[businessId]/inventory/dashboard/route.ts` |
| Inventory API | `src/app/api/admin/stores/[businessId]/products/[productId]/inventory/route.ts` |
| Activities API | `src/app/api/admin/stores/[businessId]/inventory/activities/route.ts` |
| Cron Job | `src/app/api/cron/low-stock-alerts/route.ts` |

---

## Conclusion

**Rating: 4.5/5** - The inventory system is now comprehensive with:
- ✅ Full stock tracking (product and variant level)
- ✅ Stock reservation for pending orders (prevents overselling)
- ✅ Automatic updates on orders
- ✅ Complete activity logging
- ✅ Low stock alerts with email notifications
- ✅ Inventory dashboard with metrics
- ✅ Stock adjustment controls
- ✅ Storefront filtering by availability

The implementation covers all core inventory management needs with stock reservation preventing overselling issues.
