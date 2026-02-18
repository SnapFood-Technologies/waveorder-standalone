# Greece Support Analysis - WaveOrder Platform

> **STATUS: COMPLETED (Feb 2026)**
> - Greek locale (el) support: DONE
> - Multi-language SEO fields (seoTitleEl, seoDescriptionEl): DONE
> - EUR currency support: DONE
> - Greek storefront translations: DONE

**Date:** January 13, 2026  
**Purpose:** Comprehensive analysis of codebase to identify requirements for supporting Greece (GR) in WaveOrder

---

## Executive Summary

This document analyzes the WaveOrder codebase to identify all changes needed to fully support businesses operating in Greece. The analysis covers language support, location data, currency, phone numbers, address formats, and all related functionality.

---

## Current State Analysis

### ✅ Already Supported

1. **Currency (EUR)**
   - ✅ EUR currency is already supported in the system
   - ✅ Currency symbol (€) is properly displayed
   - ✅ Currency formatting works for EUR
   - **Location:** `src/components/admin/products/ProductsManagement.tsx`, `src/components/admin/dashboard/DashboardMetrics.tsx`

2. **Phone Number Validation**
   - ✅ Greece phone number format is already implemented
   - ✅ Pattern: `+30` prefix with 10 digits
   - ✅ Validation: `/^(\+30|30)0?[2-9]\d{9}$/`
   - ✅ Formatting: `694 123 4567`
   - **Locations:**
     - `src/components/site/PhoneInput.tsx` (lines 45-58)
     - `src/components/admin/customers/CustomerForm.tsx` (lines 77-91)
     - `src/components/storefront/StoreFront.tsx` (lines 1778-1780)

3. **Country Detection**
   - ✅ Greece (GR) is detected in business settings
   - ✅ Country code mapping exists
   - **Location:** `src/components/admin/settings/BusinessSettingsForm.tsx` (line 86-172)

4. **Storefront Language Detection**
   - ✅ Albanian option shows when country is GR or AL
   - **Location:** `src/components/admin/settings/BusinessSettingsForm.tsx` (line 794)

---

## ❌ Missing / Needs Implementation

### 1. Language Support (Greek - `el`)

**Status:** ❌ **NOT IMPLEMENTED**

**Current Languages:**
- English (`en`) - ✅ Full support
- Spanish (`es`) - ✅ Full support  
- Albanian (`sq`) - ✅ Full support
- **Greek (`el`) - ❌ NOT SUPPORTED**

**What Needs Translation:**

#### A. Storefront UI Translations
**File:** `src/utils/storefront-translations.ts`

**Missing:** Greek translation object (`greekTranslations`)

**Required Translations (100+ keys):**
- Navigation & Search (search, allCategories, etc.)
- Status messages (open, closed, outOfStock, etc.)
- Form fields (name, email, address, etc.)
- Cart & Checkout (subtotal, deliveryFee, total, etc.)
- Product modal (chooseSize, addExtras, quantity, etc.)
- Placeholders (streetAddress, selectCountry, postalCode, etc.)
- Phone validation messages
- Error messages
- Success messages

**Current Structure:**
```typescript
export const getStorefrontTranslations = (language: string): StorefrontTranslations => {
  if (language === 'sq' || language === 'al') {
    return albanianTranslations
  } else if (language === 'es') {
    return spanishTranslations
  }
  return englishTranslations // Falls back to English for Greek
}
```

**Needed:**
```typescript
else if (language === 'el' || language === 'gr') {
  return greekTranslations
}
```

#### B. Email Notifications
**File:** `src/lib/customer-email-notification.ts`

**Missing:** Greek translations for:
- Email subject lines
- Status messages (CONFIRMED, READY, PAYMENT_RECEIVED, etc.)
- Email template labels (Order Items, Delivery Address, etc.)
- Button text
- Footer messages

**Current:** Falls back to English for Greek businesses

#### C. WhatsApp Messages
**File:** `src/app/api/storefront/[slug]/order/route.ts`

**Missing:** `messageTerms` object for Greek (`el`)

**Required Translations:**
- Order labels (Order, Subtotal, Total, Customer, Phone, etc.)
- Delivery type labels (Delivery, Pickup, Dine In)
- Time labels (Delivery Time, Pickup Time, Arrival Time)
- Payment and notes labels
- Status update messages
- Business info labels

**Current Structure:**
```typescript
const messageTerms = {
  en: { RESTAURANT: {...}, RETAIL: {...} },
  es: { RESTAURANT: {...}, RETAIL: {...} },
  sq: { RESTAURANT: {...}, RETAIL: {...} }
  // Missing: el
}
```

#### D. Admin Interface
**File:** `src/components/admin/orders/OrderDetails.tsx`

**Missing:** Greek translations for admin order status messages

#### E. Language Selection in Settings
**File:** `src/components/admin/settings/BusinessSettingsForm.tsx`

**Missing:** Greek option in language dropdown

**Current:**
```typescript
<option value="en">English</option>
<option value="es">Spanish (Español)</option>
{(detectedCountry === 'AL' || detectedCountry === 'GR') && (
  <option value="sq">Albanian (Shqip)</option>
)}
// Missing: <option value="el">Greek (Ελληνικά)</option>
```

---

### 2. Location Data (Countries, States, Cities)

**Status:** ❌ **NOT IMPLEMENTED**

**Current Countries in Database:**
- Kosovo (XK) - ✅
- North Macedonia (MK) - ✅
- Albania (AL) - ✅
- **Greece (GR) - ❌ MISSING**

**File:** `scripts/populate-locations.ts`

**What's Needed:**
1. Add Greece country data to `populate-locations.ts`
2. Add Greek states/regions (13 administrative regions):
   - Attica (Αττική)
   - Central Macedonia (Κεντρική Μακεδονία)
   - Central Greece (Στερεά Ελλάδα)
   - Crete (Κρήτη)
   - Eastern Macedonia and Thrace (Ανατολική Μακεδονία και Θράκη)
   - Epirus (Ήπειρος)
   - Ionian Islands (Ιόνια Νησιά)
   - North Aegean (Βόρειο Αιγαίο)
   - Peloponnese (Πελοπόννησος)
   - South Aegean (Νότιο Αιγαίο)
   - Thessaly (Θεσσαλία)
   - Western Greece (Δυτική Ελλάδα)
   - Western Macedonia (Δυτική Μακεδονία)

3. Add major cities for each region:
   - Athens (Αθήνα) - Attica
   - Thessaloniki (Θεσσαλονίκη) - Central Macedonia
   - Patras (Πάτρα) - Western Greece
   - Heraklion (Ηράκλειο) - Crete
   - And many more...

**Data Structure Needed:**
```typescript
const GREECE_DATA: LocationData = {
  countryCode: 'GR',
  countryName: 'Greece',
  countryGeonameId: 390903, // Greece's geonameId
  states: [
    {
      name: 'Attica',
      code: 'I',
      geonameId: 264371,
      cities: [
        { name: 'Athens', geonameId: 264371 },
        { name: 'Piraeus', geonameId: 255274 },
        // ... more cities
      ]
    },
    // ... 12 more states
  ]
}
```

**API Endpoints:**
- `/api/storefront/locations/countries` - Will return Greece once added
- `/api/storefront/locations/cities?countryCode=GR` - Will work once data is populated

---

### 3. Address Format

**Status:** ⚠️ **PARTIALLY SUPPORTED**

**Current Implementation:**
- RETAIL businesses use: Country → City → Street → Postal Code
- Address format is generic and should work for Greece

**Greek Address Format:**
- Street name + Street number
- Postal code (5 digits, e.g., 10431)
- City name
- Country

**What's Needed:**
- ✅ Current format should work (Street, City, Postal Code, Country)
- ⚠️ May need validation for Greek postal codes (5 digits)
- ⚠️ May need Greek city name suggestions/autocomplete

**Files to Check:**
- `src/components/storefront/StoreFront.tsx` - Address form for RETAIL
- Address validation logic

---

### 4. Postal Code System

**Status:** ⚠️ **NEEDS VERIFICATION**

**Greek Postal Codes:**
- Format: 5 digits (e.g., 10431 for Athens)
- First 2 digits indicate region
- Last 3 digits indicate specific area

**Current Implementation:**
- Generic postal code input
- No specific validation for Greek format

**What's Needed:**
- Optional: Add Greek postal code validation (5 digits)
- Optional: Add postal code to city mapping for autocomplete

**Files:**
- `src/components/storefront/StoreFront.tsx` - Postal code input
- `src/utils/storefront-translations.ts` - Postal code placeholder text

---

### 5. Timezone Support

**Status:** ✅ **ALREADY SUPPORTED**

**Greece Timezone:**
- `Europe/Athens` (UTC+2 in winter, UTC+3 in summer - DST)

**Current Implementation:**
- Business model has `timezone` field (String)
- Default: `UTC`
- Can be set to any timezone string
- ✅ `Europe/Athens` will work if manually set

**What's Needed:**
- ⚠️ Auto-detect `Europe/Athens` for Greek businesses (similar to Albania detection)
- **File:** `src/components/setup/steps/StoreCreationStep.tsx` (lines 24-31)

**Current Detection:**
```typescript
// Only detects Europe/Tirane for Albania
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
if (timezone === 'Europe/Tirane') {
  // Set to Albania
}
```

**Needed:**
```typescript
if (timezone === 'Europe/Tirane') {
  // Albania
} else if (timezone === 'Europe/Athens') {
  // Greece
}
```

---

### 6. Payment Methods

**Status:** ✅ **ALREADY SUPPORTED**

**Current Implementation:**
- EUR currency payment methods are supported
- Stripe, PayPal, Cash on Delivery, Bank Transfer all work with EUR
- **File:** `src/components/admin/settings/BusinessConfiguration.tsx` (lines 221-290)

**What's Needed:**
- ✅ No changes needed - EUR payment methods already work

---

### 7. Business Hours

**Status:** ✅ **ALREADY SUPPORTED**

**Current Implementation:**
- Business hours stored as JSON
- Timezone-aware
- Works with any timezone including `Europe/Athens`

**What's Needed:**
- ✅ No changes needed

---

### 8. Currency Formatting

**Status:** ✅ **ALREADY SUPPORTED**

**Current Implementation:**
- EUR symbol (€) is supported
- Currency formatting works correctly
- **Files:**
  - `src/components/admin/products/ProductsManagement.tsx` (line 201)
  - `src/components/admin/dashboard/DashboardMetrics.tsx` (line 92)
  - `src/components/admin/orders/OrdersList.tsx` (line 196)

**What's Needed:**
- ✅ No changes needed

---

### 9. Phone Number Formatting in WhatsApp

**Status:** ⚠️ **NEEDS VERIFICATION**

**File:** `src/app/api/storefront/[slug]/order/route.ts`

**Current Implementation:**
- `formatWhatsAppNumber()` function handles phone formatting
- Has specific logic for Albania, Kosovo, North Macedonia
- **Missing:** Specific handling for Greece (+30)

**What's Needed:**
- Verify if Greek phone numbers format correctly in WhatsApp messages
- May need to add Greece-specific formatting logic

---

### 10. Email Footer & Legal

**Status:** ⚠️ **NEEDS REVIEW**

**Current Implementation:**
- Email footer uses business name in copyright
- Generic legal text

**What's Needed:**
- Review if Greece-specific legal requirements exist
- May need Greek privacy policy link
- May need Greek terms of service

**Files:**
- `src/lib/customer-email-notification.ts`

---

## Implementation Checklist

### Priority 1: Critical (Required for Basic Functionality)

- [ ] **1.1** Add Greek language (`el`) to storefront translations
  - File: `src/utils/storefront-translations.ts`
  - Create `greekTranslations` object with all 100+ translation keys
  - Update `getStorefrontTranslations()` function

- [ ] **1.2** Add Greek to language selection dropdown
  - File: `src/components/admin/settings/BusinessSettingsForm.tsx`
  - Add `<option value="el">Greek (Ελληνικά)</option>`

- [ ] **1.3** Add Greece location data
  - File: `scripts/populate-locations.ts`
  - Add `GREECE_DATA` constant with all 13 regions and major cities
  - Update `main()` function to include Greece

- [ ] **1.4** Add Greek WhatsApp message translations
  - File: `src/app/api/storefront/[slug]/order/route.ts`
  - Add `el` key to `messageTerms` object
  - Add translations for RESTAURANT and RETAIL business types

- [ ] **1.5** Add Greek email notification translations
  - File: `src/lib/customer-email-notification.ts`
  - Add Greek translations for all status messages
  - Add Greek email template labels

### Priority 2: Important (Enhances User Experience)

- [ ] **2.1** Auto-detect Greece timezone
  - File: `src/components/setup/steps/StoreCreationStep.tsx`
  - Add `Europe/Athens` detection logic

- [ ] **2.2** Verify phone number formatting in WhatsApp
  - File: `src/app/api/storefront/[slug]/order/route.ts`
  - Test and potentially add Greece-specific formatting

- [ ] **2.3** Add Greek postal code validation (optional)
  - Validate 5-digit format
  - Add to address form validation

### Priority 3: Nice to Have (Polish)

- [ ] **3.1** Add Greek city autocomplete
- [ ] **3.2** Review and update legal/terms for Greece
- [ ] **3.3** Add Greek-specific payment method descriptions (if needed)

---

## Files That Need Modification

### Core Translation Files
1. `src/utils/storefront-translations.ts` - Add Greek translations
2. `src/lib/customer-email-notification.ts` - Add Greek email translations
3. `src/app/api/storefront/[slug]/order/route.ts` - Add Greek WhatsApp translations

### Settings & Configuration
4. `src/components/admin/settings/BusinessSettingsForm.tsx` - Add Greek language option
5. `src/components/setup/steps/StoreCreationStep.tsx` - Add Greece timezone detection

### Location Data
6. `scripts/populate-locations.ts` - Add Greece country/state/city data

### Verification/Testing
7. `src/components/storefront/StoreFront.tsx` - Verify address format works for Greece
8. `src/app/api/storefront/[slug]/order/route.ts` - Verify phone formatting

---

## Translation Keys Required

### Storefront UI (100+ keys)
All keys from `StorefrontTranslations` interface need Greek translations:
- Navigation, search, status messages
- Form fields, placeholders
- Cart, checkout, product modal
- Error messages, validation messages
- Phone validation messages

### Email Notifications (~20 keys)
- Status messages (CONFIRMED, READY, PAYMENT_RECEIVED, etc.)
- Email template labels
- Button text
- Footer messages

### WhatsApp Messages (~30 keys)
- Order labels
- Delivery type labels
- Time labels
- Payment labels
- Business info labels

**Total:** ~150+ translation keys needed

---

## Data Requirements

### Location Data
- **1 Country:** Greece (GR)
- **13 Administrative Regions** (states)
- **~100+ Major Cities** (minimum for each region)

### Geoname IDs
- Need geonameId for:
  - Greece country
  - Each of 13 regions
  - Each major city

**Source:** Geonames.org or similar location database

---

## Testing Checklist

Once implemented, test:

- [ ] Greek language appears in language dropdown
- [ ] Storefront UI displays in Greek when selected
- [ ] Products, categories display correctly
- [ ] Order form works in Greek
- [ ] Phone number validation works for +30 numbers
- [ ] Address form works for Greek addresses
- [ ] Postal codes accept 5-digit format
- [ ] Email notifications sent in Greek
- [ ] WhatsApp messages formatted in Greek
- [ ] Currency displays as € (EUR)
- [ ] Timezone shows Europe/Athens
- [ ] Business hours work with Greek timezone
- [ ] Location selection works (Greece → Region → City)
- [ ] Order creation works end-to-end in Greek

---

## Notes

1. **Language Code:** Use `el` (ISO 639-1) for Greek, not `gr` (country code)
2. **Existing Infrastructure:** Most infrastructure is already in place - mainly needs translations and data
3. **Phone Numbers:** Already supported, just needs verification
4. **Currency:** Already fully supported (EUR)
5. **Timezone:** Supported, just needs auto-detection

---

## Dependencies

- Greek translator or native Greek speaker for translations
- Geonames.org or similar for location data (geonameIds)
- Testing environment with Greek business setup

---

**Document Version:** 1.0  
**Last Updated:** January 13, 2026  
**Author:** AI Assistant (Codebase Analysis)
