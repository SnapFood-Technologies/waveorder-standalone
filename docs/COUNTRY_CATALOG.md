# Country-based catalog

## Behavior

- **Business flag** `countryBasedCatalogEnabled` (default `false`): when off, storefront queries are unchanged and visitor country is not resolved (no extra latency).
- **Product** `visibleCountryCodes` / `hiddenCountryCodes` (ISO 3166-1 alpha-2, uppercase). Empty `visibleCountryCodes` = visible everywhere (still subject to `hiddenCountryCodes`). If a visitor’s country is in `hiddenCountryCodes`, the product is hidden.

## Visitor country resolution (server)

Order:

1. Query `?cc=` or `?visitorCountry=` on this request (including API calls where the client appends `visitorCountry`).
2. Async IP geolocation (`getLocationFromIP`) when the query has no ISO2.

There is **no** server-side parsing of cookies or CDN/edge headers (Cloudflare/Vercel/etc.); use query params or rely on IP.

If no ISO2 is resolved, **no country filter** is applied (same catalog as before the feature).

## Storefront client

When `countryBasedCatalogEnabled` is true in `storeData`, product list requests append `visitorCountry=<ISO2>` when a value is known from the URL or from the browser cookie (set when `?cc` / `?visitorCountry` was used). The client sends country as a **query param** on fetches so the server does not need to read the cookie header.

## Admin / SuperAdmin

- **SuperAdmin** enables the feature: `PATCH /api/superadmin/businesses/[businessId]/settings` with `{ "countryBasedCatalogEnabled": true }`, or the toggle on the business detail page.
- **Merchants** edit lists on each product (Admin → Products) via **multiselect dropdowns**. Only these ISO2 codes are selectable in the UI (aligned with phone/locale support): **AL, GR, IT, ES, BH, BB, US**. Other codes stored historically are ignored on load until re-saved. **Admin hub**: Products → **Country Based** (when enabled).

## Aggregates

- `GET /api/admin/stores/[businessId]/catalog/countries` (business access or impersonation).
- `GET /api/superadmin/businesses/[businessId]/catalog/countries` (SuperAdmin only).
