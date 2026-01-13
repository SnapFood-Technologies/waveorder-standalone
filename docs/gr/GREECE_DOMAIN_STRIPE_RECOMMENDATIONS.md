# Greece Support - Domain & Stripe Currency Recommendations

**Date:** January 13, 2026  
**Purpose:** Recommendations for domain strategy and Stripe multi-currency setup for Greece (EUR) support

---

## 1. Domain Strategy Recommendation

### ✅ Recommended: Single Main Domain

**Use:** `waveorder.app` (or your current main domain)

**Rationale:**
- ✅ Single brand identity across all markets
- ✅ Easier SEO management and link building
- ✅ Simpler SSL certificate management (one certificate)
- ✅ Single codebase deployment
- ✅ Lower maintenance overhead
- ✅ Better for global brand recognition
- ✅ Language/country detection handled in-app (already implemented)

**Implementation:**
- No changes needed - current domain works for all countries
- Use in-app language/country detection (already implemented)
- Business can select Greek language in settings
- Storefront automatically displays in selected language

**Alternative Options Considered:**

#### Option B: Country-Specific Domain (`waveorder.gr`)
- ❌ Requires separate domain registration
- ❌ Additional SSL certificate
- ❌ More complex DNS management
- ❌ Potential SEO duplicate content issues
- ✅ Better local SEO (minor benefit)
- **Verdict:** Not recommended - minimal benefit for high maintenance cost

#### Option C: Subdomain Strategy (`gr.waveorder.app`)
- ⚠️ Requires subdomain routing setup
- ⚠️ Less memorable than country TLD
- ✅ Single domain, easy routing
- **Verdict:** Not necessary - current setup is sufficient

---

## 2. Stripe Currency Strategy - EUR Support for Greece

### Current State

**Subscription Pricing:**
- PRO Plan: $12/month USD (or $10/month annual)
- FREE Plan: $0

**Current Implementation:**
- Uses USD Stripe Price IDs
- All businesses charged in USD
- Stripe handles currency conversion automatically

### ✅ Recommended: Multi-Currency Stripe Setup

#### Option A: EUR Prices in Stripe (Recommended)

**Setup:**
1. Create EUR prices in Stripe Dashboard
2. Add EUR Price ID environment variables
3. Update code to select Price ID based on business currency
4. Display prices in business currency in UI

**EUR Pricing Recommendation:**
- **EUR Monthly:** €10/month
- **EUR Annual:** €100/year (€8.33/month equivalent)
- **Rationale:** 
  - Slightly lower than USD equivalent (~€11)
  - Better market competitiveness in Europe
  - Rounded numbers (easier for customers)
  - Matches European pricing expectations

**Implementation Steps:**

1. **Create Stripe Prices:**
   - Go to Stripe Dashboard → Products → PRO Plan
   - Add new price: €10.00 EUR, recurring monthly
   - Add new price: €100.00 EUR, recurring yearly
   - Copy Price IDs (format: `price_xxxxx`)

2. **Environment Variables:**
   ```env
   # Existing USD Prices
   STRIPE_PRO_PRICE_ID=price_xxxxx_usd_monthly
   STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxxx_usd_annual
   
   # New EUR Prices for Greece
   STRIPE_PRO_PRICE_ID_EUR=price_xxxxx_eur_monthly
   STRIPE_PRO_ANNUAL_PRICE_ID_EUR=price_xxxxx_eur_annual
   ```

3. **Code Changes Needed:**
   - `src/lib/stripe.ts` - Add currency-based Price ID selection
   - `src/app/api/billing/create-checkout/route.ts` - Select Price ID based on business currency
   - `src/components/admin/billing/BillingPanel.tsx` - Display EUR prices for EUR businesses
   - `src/components/site/Pricing.tsx` - Show EUR pricing when applicable

**Currency Detection Logic:**
- Check `business.currency` field
- If `currency === 'EUR'` → Use EUR Price IDs
- If `currency === 'USD'` → Use USD Price IDs
- Default to USD if currency not recognized

---

### Alternative Options (Not Recommended)

#### Option B: Single USD Price with Auto-Conversion
- ❌ Customers see USD prices (confusing)
- ❌ Stripe converts, but pricing appears in wrong currency
- ❌ Poor user experience
- **Verdict:** Not recommended

#### Option C: Fixed Exchange Rate Pricing
- ⚠️ Requires manual updates when exchange rates change
- ⚠️ More complex maintenance
- **Verdict:** Not necessary - Stripe handles conversions

---

## 3. Pricing Structure

### Recommended EUR Pricing

| Plan | Monthly | Annual (per month) | Annual Total |
|------|---------|-------------------|--------------|
| **FREE** | €0 | €0 | €0 |
| **PRO** | €10 | €8.33 | €100 |

**Comparison to USD:**
- USD PRO: $12/month = ~€11/month
- EUR PRO: €10/month (slightly lower for market competitiveness)

### Pricing Display Logic

**For EUR Businesses (Greece):**
- Display: "€10/month" or "€100/year"
- Stripe Checkout: Uses EUR Price ID
- Customer charged in EUR

**For USD Businesses:**
- Display: "$12/month" or "$120/year"
- Stripe Checkout: Uses USD Price ID
- Customer charged in USD

**For Other Currencies (e.g., ALL - Albania):**
- Display: Converted equivalent or default to USD
- Stripe Checkout: Use USD Price ID (Stripe will convert)
- **Note:** Consider adding ALL-specific prices later if needed

---

## 4. Implementation Details

### Files to Modify

1. **`src/lib/stripe.ts`**
   - Add function: `getPriceIdForCurrency(plan, billing, currency)`
   - Returns correct Stripe Price ID based on currency

2. **`src/app/api/billing/create-checkout/route.ts`**
   - Fetch business currency before creating checkout
   - Use `getPriceIdForCurrency()` to select correct Price ID
   - Pass currency to Stripe Checkout Session

3. **`src/components/admin/billing/BillingPanel.tsx`**
   - Display prices in business currency
   - Show EUR symbol (€) for EUR businesses
   - Show USD symbol ($) for USD businesses

4. **`src/components/site/Pricing.tsx`**
   - Detect business currency (if applicable)
   - Display appropriate pricing

### Stripe Checkout Configuration

**Currency Parameter:**
```typescript
// In checkout session creation
{
  currency: business.currency.toLowerCase(), // 'eur' or 'usd'
  // ... other params
}
```

**Note:** Stripe requires currency to match Price currency when using Price IDs.

---

## 5. Testing Checklist

After implementation, test:

- [ ] EUR business sees €10/month pricing in billing panel
- [ ] USD business sees $12/month pricing (unchanged)
- [ ] Stripe checkout session uses correct EUR Price ID
- [ ] Stripe checkout displays €10/month (not USD)
- [ ] Customer is charged in EUR (not USD)
- [ ] Subscription webhook correctly identifies EUR subscription
- [ ] Subscription renewal uses EUR price
- [ ] Annual plan works correctly (€100/year)
- [ ] Free plan works (no currency needed)
- [ ] Currency symbol displays correctly (€) in UI

---

## 6. Future Considerations

### Potential Additions

1. **Albanian Lek (ALL) Pricing:**
   - If many Albanian businesses use the platform
   - Create ALL-specific Stripe prices
   - Note: Stripe may not support ALL - check Stripe documentation
   - Alternative: Use EUR for Albanian businesses

2. **Dynamic Pricing:**
   - Adjust EUR pricing based on exchange rate
   - More complex, requires periodic updates
   - Only needed if exchange rate fluctuations are significant

3. **Regional Pricing:**
   - Different prices for different European countries
   - More complex setup
   - Only if market research shows need

---

## 7. Summary

### Domain
- ✅ **Recommendation:** Keep single domain (`waveorder.app`)
- ✅ **Reason:** Simpler, better for brand, sufficient for multi-country support
- ✅ **Action:** No changes needed

### Stripe Currency
- ✅ **Recommendation:** Create EUR prices in Stripe
- ✅ **Pricing:** €10/month, €100/year for PRO plan
- ✅ **Implementation:** Add EUR Price IDs, update code to select based on currency
- ✅ **Benefit:** Better UX, local pricing, customers charged in their currency

---

## 8. Next Steps

1. **In Stripe Dashboard:**
   - [ ] Create EUR prices for PRO plan (monthly & annual)
   - [ ] Copy EUR Price IDs
   - [ ] Add to environment variables

2. **In Codebase:**
   - [ ] Update `src/lib/stripe.ts` with currency selection logic
   - [ ] Update checkout API to use currency-based Price IDs
   - [ ] Update billing UI to display EUR prices
   - [ ] Test with EUR business account

3. **Testing:**
   - [ ] Create test EUR business
   - [ ] Verify pricing displays correctly
   - [ ] Complete test subscription checkout
   - [ ] Verify charge is in EUR

---

**Document Version:** 1.0  
**Last Updated:** January 13, 2026
