# Internal Invoice System — Product Requirements Document

**Version:** 1.0
**Date:** February 27, 2026
**Status:** Draft
**Author:** WaveOrder Engineering

---

## 1. Overview

**Internal Invoice System** is an opt-in feature that lets businesses generate professional invoices for completed, paid orders. Invoices are for internal record-keeping only — not tax-related, not taxable. SuperAdmin enables the feature per business on the business details screen (not custom features).

---

## 2. Problem Statement

Businesses need a way to:
- Generate a formal invoice for completed orders
- Keep records for their own accounting
- Provide customers with a clean, branded document

This is separate from tax invoices — it's a simple order summary document.

---

## 3. Goals and Non-Goals

### Goals

- SuperAdmin can enable/disable per business on **Business Details** screen (not Custom Features)
- Admin sees usage summary when feature is enabled
- Admin can generate invoice only when order is **completed** (DELIVERED or PICKED_UP) **and** payment status is **PAID**
- Invoice design: Stripe-style, professional, with business logo, storefront branding (colors), "Powered by WaveOrder" footer
- Invoice stored in database
- Settings menu: "Invoices" link → page listing all invoices for the business
- View and download invoices (PDF)
- Optional note field (pre-filled, editable) shown on invoice (footer or designated area)

### Non-Goals

- Tax invoices or tax compliance
- Integration with accounting software
- Sending invoices via email (future consideration)
- Invoice for non-completed or unpaid orders

---

## 4. User Stories

### SuperAdmin

1. **As a SuperAdmin**, I want to enable the internal invoice feature for a business on the Business Details screen, so I can control rollout.

2. **As a SuperAdmin**, I want to see which businesses have the feature enabled, so I can track adoption.

### Business Admin

3. **As a business admin**, I want to generate an invoice when an order is completed and paid, so I can provide a formal record to the customer.

4. **As a business admin**, I want to add an optional note to the invoice before generating, so I can include special terms or disclaimers.

5. **As a business admin**, I want to see a summary of how many invoices have been generated, so I can track usage.

6. **As a business admin**, I want to access all invoices from Settings → Invoices, so I can view and download them.

7. **As a business admin**, I want invoices to use my business logo and brand colors, so they look professional and on-brand.

---

## 5. Feature Enablement

### SuperAdmin Business Details Screen

Add a toggle section (similar to Packaging Tracking, Invoice/Receipt Selection):

```
┌─────────────────────────────────────────────────────────┐
│  Internal Invoice System                     [Toggle]    │
│  Enable order invoices for this business. Invoices can   │
│  be generated for completed, paid orders. Internal use   │
│  only — not tax-related.                                 │
│                                                          │
│  Status: Enabled ✓                                       │
└─────────────────────────────────────────────────────────┘
```

**Location:** Business Details page, in the feature toggles area (near Packaging Tracking, etc.)

---

## 6. Data Model

### Business Model — New Field

```prisma
model Business {
  // ... existing fields ...
  internalInvoiceEnabled  Boolean  @default(false)
}
```

### New Model: OrderInvoice

```prisma
model OrderInvoice {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  orderId     String   @db.ObjectId
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  businessId  String   @db.ObjectId
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  invoiceNumber   String   // e.g. "INV-2026-0001" (business-scoped, sequential)
  note            String?  // Optional note (footer or body)
  generatedAt     DateTime @default(now())
  generatedById   String?  @db.ObjectId // User who generated it

  @@unique([businessId, invoiceNumber])
  @@index([businessId])
  @@index([orderId])
}
```

### Order Model — Relation

```prisma
model Order {
  // ... existing fields ...
  invoice OrderInvoice?
}
```

---

## 7. Invoice Design (Stripe-style)

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Business Logo]                    INVOICE             │
│  {Business Name}                    #{invoiceNumber}    │
│  {Address, Phone, Email}                                │
│                                                          │
│  Bill to:                                                │
│  {Customer Name}                                         │
│  {Customer Address / Phone / Email}                      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Order # {orderNumber}    Date: {orderDate}              │
├─────────────────────────────────────────────────────────┤
│  Item                    Qty    Price      Amount        │
│  ─────────────────────────────────────────────────────  │
│  {Product name}           2     €5.00     €10.00        │
│    + Modifier: Extra      1     €1.00      €1.00        │
│  {Product name}           1     €8.50      €8.50        │
│  ─────────────────────────────────────────────────────  │
│  Subtotal                            €19.50             │
│  Delivery fee                         €2.00             │
│  Discount                            -€1.50             │
│  ─────────────────────────────────────────────────────  │
│  Total                               €20.00             │
├─────────────────────────────────────────────────────────┤
│  Payment: {Payment method} • Paid                        │
│                                                          │
│  {Note - if provided}                                    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  This is an internal document. Not a tax invoice.       │
│  Powered by WaveOrder                                    │
└─────────────────────────────────────────────────────────┘
```

### Branding

- **Logo:** Business logo (from Business.logo or Store logo)
- **Colors:** Primary color from storefront / business branding
- **Font:** Clean, professional (e.g. Inter or system font)
- **Footer:** "This is an internal document. Not a tax invoice." + "Powered by WaveOrder"

---

## 8. Order Details — Generate Invoice Flow

### When to Show "Generate Invoice"

- Feature enabled (`internalInvoiceEnabled === true`)
- Order status: `DELIVERED` or `PICKED_UP`
- Payment status: `PAID`
- No invoice exists yet for this order

### UI Flow

1. User clicks "Generate Invoice" button
2. Modal opens with:
   - Pre-filled note: e.g. "Thank you for your order. This is an internal document for your records."
   - Editable textarea (user can change before generating)
   - "Generate" and "Cancel" buttons
3. On Generate: create OrderInvoice, store note, redirect or show success + link to view

---

## 9. Admin Usage Summary

When `internalInvoiceEnabled` is true, show on admin dashboard or a dedicated section:

- **Total invoices generated** (all time or period)
- **Last generated** (date)
- Link to Settings → Invoices

**Location:** Could be a small card on the main dashboard, or in Settings, or a dedicated "Invoices" widget when the feature is enabled.

---

## 10. Settings Menu

Add under Settings (when `internalInvoiceEnabled`):

```
Settings
  ├── Business
  ├── Billing
  ├── Notifications
  ├── Configurations
  ├── ...
  └── Invoices          ← NEW (when internalInvoiceEnabled)
```

**Route:** `/admin/stores/[businessId]/settings/invoices`

---

## 11. Invoices Page

### Route

`/admin/stores/[businessId]/settings/invoices`

### Content

- Table/list of all invoices for the business
- Columns: Invoice #, Order #, Customer, Date, Amount
- Actions: View, Download (PDF)
- Filter by date range (optional)
- Pagination

---

## 12. API Endpoints

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| POST | `/api/admin/stores/[businessId]/orders/[orderId]/invoice` | Generate invoice | Admin (business access) |
| GET | `/api/admin/stores/[businessId]/invoices` | List invoices | Admin |
| GET | `/api/admin/stores/[businessId]/invoices/[invoiceId]` | Get invoice (JSON or PDF) | Admin |
| PATCH | `/api/superadmin/businesses/[businessId]` | Update `internalInvoiceEnabled` | SuperAdmin |

---

## 13. Invoice Number Format

- Per-business sequential: `INV-{YYYY}-{NNNN}` e.g. `INV-2026-0001`
- Reset annually or continuous (TBD)

---

## 14. Implementation Phases

### Phase 1 — Core

- Add `internalInvoiceEnabled` to Business model
- Add OrderInvoice model
- Add toggle to SuperAdmin Business Details page
- Build generate-invoice API + modal on Order Details
- Build invoice PDF/view (HTML → PDF or server-side PDF)
- Store invoice with note

### Phase 2 — List & Download

- Invoices page under Settings
- List API with pagination
- Download PDF
- Add "Invoices" to Settings sidebar when enabled

### Phase 3 — Polish

- Usage summary on admin dashboard
- Invoice design refinements (logo, colors)
- Error handling, edge cases

---

## 15. Disclaimer Text

Every invoice must include:

> **This is an internal document. Not a tax invoice. Not taxable.**

(Or similar — legal to confirm exact wording.)

---

## 16. Future Considerations

- Email invoice to customer
- Bulk download (zip)
- Custom invoice template per business
- Multi-currency display
