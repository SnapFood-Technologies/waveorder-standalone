# Delivery/Pickup Scheduling - Current State

> **Status**: Complete  
> **Last Updated**: January 2026  
> **Reviewer**: Griseld (1)

## Summary

WaveOrder has a comprehensive scheduling system with business hours management, dynamic time slot generation, slot capacity limits, holiday hours override, and customer-facing time selection. The system supports delivery, pickup, and dine-in orders with timezone-aware calculations.

---

## What We Have

### Database Models

**Business Model** (`prisma/schema.prisma`):
```prisma
businessHours           Json?                 // Operating hours per day
slotDuration            Int     @default(30)  // Time slot duration (15, 30, 60 min)
slotCapacity            Int?                  // Max orders per slot (null = unlimited)
deliveryBufferMinutes   Int     @default(45)  // Buffer time for delivery
pickupBufferMinutes     Int     @default(20)  // Buffer time for pickup
holidayHours            Json?                 // Special hours for specific dates
```

**Order Model**:
```prisma
deliveryTime DateTime?  // Scheduled delivery/pickup time
```

---

## Features

### Time Slot Configuration
| Feature | Status |
|---------|--------|
| Configurable slot duration (15/30/60 min) | ✅ |
| Slot capacity limits (max orders per slot) | ✅ |
| Configurable delivery buffer time | ✅ |
| Configurable pickup buffer time | ✅ |
| Holiday hours override | ✅ |
| Business hours per day | ✅ |

### Admin Features
| Feature | Status |
|---------|--------|
| Set hours per day (open/close times) | ✅ |
| Mark days as closed | ✅ |
| Copy hours to all days | ✅ |
| Current status indicator (open/closed) | ✅ |
| Timezone-aware display | ✅ |
| Scheduling configuration panel | ✅ |
| Holiday hours management | ✅ |

### Storefront Features
| Feature | Status |
|---------|--------|
| "Now" (ASAP) option | ✅ |
| "Schedule" option | ✅ |
| Date selection (next 7 days) | ✅ |
| Time slot dropdown | ✅ |
| Dynamic labels by order type | ✅ |
| 12-hour and 24-hour formats | ✅ |
| Force schedule mode when closed | ✅ |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stores/[businessId]/business-hours` | GET | Fetch business hours + scheduling config |
| `/api/admin/stores/[businessId]/business-hours` | PUT | Update business hours |
| `/api/admin/stores/[businessId]/scheduling` | GET | Get scheduling configuration |
| `/api/admin/stores/[businessId]/scheduling` | PUT | Update scheduling configuration |
| `/api/admin/stores/[businessId]/scheduling/slots` | GET | Check slot availability/capacity |
| `/api/admin/stores/[businessId]/status` | GET | Get open/closed status |
| `/api/storefront/[slug]` | GET | Includes `schedulingConfig` |
| `/api/storefront/[slug]/order` | POST | Creates order with `deliveryTime` |

---

## Scheduling Configuration

### Slot Duration Options
- 15 minutes
- 30 minutes (default)
- 60 minutes

### Buffer Time Options
- 0 (no buffer) to 120 minutes
- Default delivery: 45 minutes
- Default pickup: 20 minutes

### Slot Capacity
- Set maximum orders per time slot
- Leave empty for unlimited

### Holiday Hours
- Override regular hours for specific dates
- Set as closed or custom hours
- Format: `{ "2026-12-25": { closed: true }, "2026-12-31": { open: "10:00", close: "15:00" } }`

---

## How It Works

### Customer Flow
```
1. Customer selects delivery/pickup type
         ↓
2. Time selection shows "Now" or "Schedule"
         ↓
3. If "Schedule":
   - Select date (today + next 6 days)
   - Select time slot (configurable intervals)
   - Slots filtered by capacity
         ↓
4. Selected time stored as ISO string
         ↓
5. Order created with deliveryTime field
```

### Slot Generation Logic
1. Check for holiday hours override first
2. Fall back to regular business hours
3. Generate slots based on configured duration
4. Apply buffer time for today's slots
5. Check slot capacity against existing orders
6. Filter out unavailable slots

---

## Files Reference

| Purpose | Path |
|---------|------|
| Schema | `prisma/schema.prisma` |
| Admin Hours Component | `src/components/admin/settings/BusinessHoursManagement.tsx` |
| Scheduling Config Component | `src/components/admin/settings/SchedulingConfiguration.tsx` |
| Business Hours API | `src/app/api/admin/stores/[businessId]/business-hours/route.ts` |
| Scheduling API | `src/app/api/admin/stores/[businessId]/scheduling/route.ts` |
| Slots API | `src/app/api/admin/stores/[businessId]/scheduling/slots/route.ts` |
| Storefront Component | `src/components/storefront/StoreFront.tsx` |
| Storefront API | `src/app/api/storefront/[slug]/route.ts` |

---

## Conclusion

**Rating: 4.5/5** - The scheduling system is now comprehensive with:
- ✅ Complete business hours management
- ✅ Configurable time slot duration (15/30/60 min)
- ✅ Slot capacity limits
- ✅ Configurable buffer times
- ✅ Holiday hours override
- ✅ Dynamic time slot generation
- ✅ Customer-friendly time selection UI
- ✅ Timezone-aware calculations
- ✅ Multiple order type support (delivery/pickup/dine-in)

The implementation covers all core scheduling needs with full admin configurability.
