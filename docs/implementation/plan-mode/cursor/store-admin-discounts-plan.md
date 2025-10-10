# Admin Discounts: List + API

## Scope

- List-only Discounts view for a store: products where originalPrice > price.
- Search by name/SKU; filter by category and status (active/inactive); pagination.
- Details icon links to existing product details page `admin/stores/[businessId]/products/[productId]`.
- No new DB schema.

## Files to Add

- `src/app/admin/stores/[businessId]/discounts/page.tsx`
- Wrapper that resolves `businessId` via `params` and renders `DiscountsList`.
- `src/components/admin/discounts/DiscountsList.tsx`
- Client component modeled on `CustomersList`/`OrdersList` patterns.
- Fetches `/api/admin/stores/[businessId]/discounts` with `page, limit, search, category, status`.
- UI: search input, category/status filters, results table (Name, SKU, Current, Original, Discount %, Category, Status, Actions), pagination.
- Uses `useImpersonation(businessId)` to preserve impersonation params on links.
- `src/app/api/admin/stores/[businessId]/discounts/route.ts`
- GET only. Uses `checkBusinessAccess`.
- Query params: `page` (default 1), `limit` (default 10), `search`, `category`, `status`.
- Prisma query: `where = { businessId, originalPrice: { not: null }, ...search/category/status }` then filter in memory for `originalPrice > price`, compute `total`, `pages`, and return paginated slice. Include `category` select for display.

## Files to Update

(No sidebar change needed) `Discounts` link already exists in `src/components/admin/layout/AdminSidebar.tsx` for PRO plan, pointing to `/admin/stores/[businessId]/discounts`.

## API Response Shape

- `{ products: Array<{ id, name, sku, price, originalPrice, category: { id, name }, isActive }>, pagination: { page, limit, total, pages } }`

## Notes

- Field comparison (originalPrice > price) is computed server-side after fetching products with non-null `originalPrice`.
- Keep component behavior consistent with `CustomersList` for debounced search and pagination UX.
- Use existing product detail route for the details icon link.