# Packaging Tracking Feature - Proposal

> **STATUS: COMPLETED (Feb 2026)**
> - Packaging model: DONE (prisma/schema.prisma)
> - Packaging management admin UI: DONE
> - Packaging assignment to orders: DONE
> - Packaging expense tracking: DONE

## Overview
A comprehensive packaging tracking system for businesses (especially jewelry, retail) to track packaging materials, purchases, usage per order, and expenses.

## Use Cases
- **Jewelry Business**: Track gift boxes, pouches, bubble wrap purchases and usage
- **Retail Business**: Track boxes, bags, wrapping paper expenses
- **Track Suppliers**: Record where packaging was purchased
- **Order-Level Tracking**: Track how many packages used per order, items per package
- **Expense Management**: Track packaging costs and calculate per-order packaging costs

---

## Database Schema

### 1. Business Model Addition
```prisma
model Business {
  // ... existing fields
  packagingTrackingEnabled Boolean @default(false) // SuperAdmin toggle
}
```

### 2. PackagingType Model (NEW)
```prisma
model PackagingType {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId String   @db.ObjectId
  name        String   // e.g., "Small Gift Box", "Jewelry Pouch", "Bubble Wrap"
  description String?  // Optional description
  unit        String   @default("piece") // "piece", "roll", "meter", etc.
  isActive    Boolean  @default(true)
  
  business           Business           @relation(fields: [businessId], references: [id], onDelete: Cascade)
  purchases          PackagingPurchase[]
  orderPackagings    OrderPackaging[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([businessId])
  @@index([businessId, isActive])
}
```

### 3. PackagingPurchase Model (NEW)
```prisma
model PackagingPurchase {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId      String   @db.ObjectId
  packagingTypeId String   @db.ObjectId
  supplier        String   // Supplier/vendor name
  supplierContact String?  // Optional contact info
  quantity        Float    // Quantity purchased
  unitCost        Float    // Cost per unit
  totalCost       Float    // quantity * unitCost
  purchaseDate    DateTime
  notes           String?  // Optional notes
  
  business       Business       @relation(fields: [businessId], references: [id], onDelete: Cascade)
  packagingType PackagingType  @relation(fields: [packagingTypeId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([businessId])
  @@index([businessId, purchaseDate])
  @@index([packagingTypeId])
}
```

### 4. OrderPackaging Model (NEW)
```prisma
model OrderPackaging {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId      String   @db.ObjectId
  orderId         String   @db.ObjectId
  packagingTypeId String   @db.ObjectId
  quantity        Int      @default(1) // Number of packages of this type used
  itemsPerPackage Int?     // How many order items fit in each package (null = not tracked)
  notes           String?  // Optional notes
  
  business       Business       @relation(fields: [businessId], references: [id], onDelete: Cascade)
  order          Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  packagingType  PackagingType  @relation(fields: [packagingTypeId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([businessId])
  @@index([orderId])
  @@index([packagingTypeId])
}
```

### 5. Order Model Addition
```prisma
model Order {
  // ... existing fields
  orderPackagings OrderPackaging[] // Relation to packaging used
}
```

---

## Features

### 1. SuperAdmin Control
- **Toggle**: Enable/disable packaging tracking per business
- **Location**: SuperAdmin Business Details page (similar to Delivery Management, Invoice/Receipt Selection)
- **API**: `/api/superadmin/businesses/[businessId]/feature-flags` (PATCH)

### 2. Business Admin Features

#### A. Packaging Types Management
- **CRUD Operations**: Create, edit, deactivate packaging types
- **Fields**: Name, Description, Unit (piece/roll/meter)
- **Page**: `/admin/stores/[businessId]/packaging/types`
- **API**: 
  - `GET /api/admin/stores/[businessId]/packaging/types`
  - `POST /api/admin/stores/[businessId]/packaging/types`
  - `PUT /api/admin/stores/[businessId]/packaging/types/[typeId]`
  - `DELETE /api/admin/stores/[businessId]/packaging/types/[typeId]`

#### B. Packaging Purchases
- **Record Purchases**: Track when packaging is bought
- **Fields**: 
  - Packaging Type (dropdown)
  - Supplier Name
  - Supplier Contact (optional)
  - Quantity
  - Unit Cost
  - Total Cost (auto-calculated)
  - Purchase Date
  - Notes (optional)
- **Page**: `/admin/stores/[businessId]/packaging/purchases`
- **API**:
  - `GET /api/admin/stores/[businessId]/packaging/purchases`
  - `POST /api/admin/stores/[businessId]/packaging/purchases`
  - `PUT /api/admin/stores/[businessId]/packaging/purchases/[purchaseId]`
  - `DELETE /api/admin/stores/[businessId]/packaging/purchases/[purchaseId]`

#### C. Order Packaging Assignment
- **Assign to Orders**: Track packaging used per order
- **Fields**:
  - Packaging Type (dropdown)
  - Quantity (how many packages)
  - Items Per Package (optional - how many order items in each package)
  - Notes (optional)
- **Location**: Order Details page (when feature enabled)
- **API**: 
  - `GET /api/admin/stores/[businessId]/orders/[orderId]/packaging`
  - `POST /api/admin/stores/[businessId]/orders/[orderId]/packaging`
  - `PUT /api/admin/stores/[businessId]/orders/[orderId]/packaging/[packagingId]`
  - `DELETE /api/admin/stores/[businessId]/orders/[orderId]/packaging/[packagingId]`

#### D. Packaging Dashboard/Reports
- **Inventory Overview**: Current stock levels per packaging type
- **Usage Statistics**: 
  - Packages used per period
  - Cost per order
  - Most used packaging types
- **Expense Tracking**: Total packaging costs, cost trends
- **Supplier Analysis**: Top suppliers, purchase history
- **Page**: `/admin/stores/[businessId]/packaging/dashboard`
- **API**: `GET /api/admin/stores/[businessId]/packaging/dashboard`

---

## UI Components

### 1. SuperAdmin UI
- **Section**: "Packaging Tracking Settings" in Business Details page
- **Toggle**: Enable/Disable packaging tracking
- **Location**: After "Invoice/Receipt Selection" section

### 2. Business Admin UI

#### Navigation (Admin Sidebar)
- **Menu Item**: "Packaging" (only visible when feature enabled)
  - Packaging Types
  - Purchases
  - Dashboard

#### Order Details Page
- **Section**: "Packaging Used" (when feature enabled)
  - List of packaging assigned to order
  - Add/Edit/Remove packaging
  - Show packaging cost per order

#### Packaging Types Page
- List of all packaging types
- Create/Edit/Deactivate buttons
- Filter by active/inactive

#### Purchases Page
- List of all purchases (table)
- Add Purchase button
- Filter by date range, supplier, packaging type
- Total cost summary

#### Dashboard Page
- **Cards**:
  - Total Packaging Types
  - Total Purchases (count)
  - Total Spent
  - Packages Used (this month)
- **Charts**:
  - Packaging usage over time
  - Cost trends
  - Top packaging types by usage
- **Tables**:
  - Recent purchases
  - Low stock alerts (if quantity tracking added)

---

## API Endpoints Summary

### SuperAdmin
- `PATCH /api/superadmin/businesses/[businessId]/feature-flags`
  - Add `packagingTrackingEnabled` field

### Business Admin - Packaging Types
- `GET /api/admin/stores/[businessId]/packaging/types`
- `POST /api/admin/stores/[businessId]/packaging/types`
- `PUT /api/admin/stores/[businessId]/packaging/types/[typeId]`
- `DELETE /api/admin/stores/[businessId]/packaging/types/[typeId]`

### Business Admin - Purchases
- `GET /api/admin/stores/[businessId]/packaging/purchases`
- `POST /api/admin/stores/[businessId]/packaging/purchases`
- `PUT /api/admin/stores/[businessId]/packaging/purchases/[purchaseId]`
- `DELETE /api/admin/stores/[businessId]/packaging/purchases/[purchaseId]`

### Business Admin - Order Packaging
- `GET /api/admin/stores/[businessId]/orders/[orderId]/packaging`
- `POST /api/admin/stores/[businessId]/orders/[orderId]/packaging`
- `PUT /api/admin/stores/[businessId]/orders/[orderId]/packaging/[packagingId]`
- `DELETE /api/admin/stores/[businessId]/orders/[orderId]/packaging/[packagingId]`

### Business Admin - Dashboard
- `GET /api/admin/stores/[businessId]/packaging/dashboard`

---

## Implementation Phases

### Phase 1: Foundation
1. Add `packagingTrackingEnabled` to Business model
2. Create PackagingType, PackagingPurchase, OrderPackaging models
3. SuperAdmin toggle UI
4. Basic CRUD APIs for Packaging Types

### Phase 2: Purchases & Order Assignment
1. Purchases CRUD APIs
2. Order Packaging assignment APIs
3. Order Details UI for packaging assignment

### Phase 3: Dashboard & Reports
1. Dashboard API with statistics
2. Dashboard UI with charts and tables
3. Reports and analytics

### Phase 4: Advanced Features (Optional)
1. Inventory quantity tracking (current stock levels)
2. Low stock alerts
3. Cost per order calculation
4. Supplier management
5. Export reports (CSV/PDF)

---

## Example Workflow

1. **SuperAdmin enables feature** for a jewelry business
2. **Business Admin creates packaging types**:
   - "Small Gift Box" (piece)
   - "Jewelry Pouch" (piece)
   - "Bubble Wrap" (roll)
3. **Business Admin records purchase**:
   - Supplier: "Packaging Supplies Co."
   - Type: "Small Gift Box"
   - Quantity: 100
   - Unit Cost: €0.50
   - Total: €50.00
4. **Order comes in** with 3 items
5. **Business Admin assigns packaging**:
   - 1x Small Gift Box (contains all 3 items)
   - 1x Jewelry Pouch (for one item)
6. **System tracks**:
   - Packaging used: 1 box + 1 pouch
   - Cost: €0.50 + €0.20 = €0.70
   - Supplier: Packaging Supplies Co.

---

## Questions to Consider

1. **Inventory Tracking**: Should we track current stock levels (quantity in - quantity out)?
   - **Option A**: Simple (no stock tracking, just purchases and usage)
   - **Option B**: Full inventory (track stock levels, low stock alerts)

2. **Cost Calculation**: How to calculate cost per package?
   - **Option A**: Average cost (total purchases / total quantity)
   - **Option B**: FIFO (First In First Out)
   - **Option C**: LIFO (Last In First Out)
   - **Option D**: Manual cost entry per order

3. **Multi-item Packages**: How detailed should tracking be?
   - **Option A**: Just quantity (e.g., "2 boxes")
   - **Option B**: Quantity + items per package (e.g., "2 boxes, 3 items each")

4. **Historical Data**: Should we allow editing past purchases/usage?
   - **Recommendation**: Allow editing with audit trail

---

## Recommendations

1. **Start Simple**: Phase 1 + Phase 2 (no inventory tracking initially)
2. **Cost Calculation**: Use average cost (simplest)
3. **Items Per Package**: Make it optional (some businesses care, others don't)
4. **Future Enhancement**: Add inventory tracking in Phase 4 if needed

---

## Next Steps

1. Review and approve proposal
2. Implement Phase 1 (Foundation)
3. Test with sample business
4. Iterate based on feedback
5. Continue with Phase 2+
