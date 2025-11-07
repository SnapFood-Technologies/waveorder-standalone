# Content Language Translation Feature

## Overview

WaveOrder supports multi-language content for customer-facing communications (emails and WhatsApp messages). The system can automatically translate all customer-facing content to the business's selected language while preserving admin-configured content like item names and business names.

## Supported Languages

Currently supported languages:
- **English (en)** - Default
- **Spanish (es)** - Full support
- **Albanian (sq)** - Full support

## Configuration

### Business Settings

1. Navigate to **Settings → Business Settings**
2. Find the **Language** section
3. Select your preferred language from the dropdown:
   - English
   - Spanish (Español)
   - Albanian (Shqip) - shown conditionally based on location detection

4. Enable/disable translation:
   - **"Translate customer-facing content to business language"** checkbox
   - Default: **Enabled (true)**
   - When enabled: All customer emails and WhatsApp messages use the business language
   - When disabled: All content defaults to English

### Database Schema

```prisma
model Business {
  language       String @default("en")
  translateContentToBusinessLanguage Boolean @default(true)
}
```

## What Gets Translated

### ✅ Translated Content

When `translateContentToBusinessLanguage` is enabled, the following are translated:

**Email Notifications:**
- Email subject lines
- Status messages (Confirmed, Ready, Payment Received, etc.)
- Email template labels (Order Items, Order Summary, Delivery Address, etc.)
- Button text and instructions
- Footer messages

**WhatsApp Messages:**
- Order labels (Order, Subtotal, Total, Customer, Phone, etc.)
- Delivery type labels (Delivery, Pickup, Dine In)
- Time labels (Delivery Time, Pickup Time, Arrival Time)
- Payment and notes labels
- Status update messages

### ❌ NOT Translated (Preserved as Admin Configured)

- **Item names** - Product names remain as configured by admin
- **Business name** - Stays as configured
- **Customer names** - Preserved as entered
- **Variant names** - Product variant names remain unchanged
- **Addresses** - Delivery addresses remain as entered
- **Notes/Special Instructions** - Customer notes remain unchanged

## Implementation Details

### Storefront WhatsApp Messages

**File:** `src/app/api/storefront/[slug]/order/route.ts`

- Uses `messageTerms` object with translations for all business types
- Checks `business.translateContentToBusinessLanguage` flag
- Falls back to English if translation not available
- Preserves item names, business names, and customer data

**Example:**
```typescript
const useBusinessLanguage = business.translateContentToBusinessLanguage !== false
const language = useBusinessLanguage ? (business.language || 'en') : 'en'
const terms = messageTerms[language]?.[businessType] || messageTerms['en']['RESTAURANT']
```

### Email Notifications

**File:** `src/lib/customer-email-notification.ts`

- Status messages translated based on business language
- Email templates support multiple languages
- Subject lines and body content translated
- Currency formatting preserved

**Status Messages:**
- `CONFIRMED` → "Your order has been confirmed..." / "Tu pedido ha sido confirmado..."
- `READY` → "Your order is ready..." / "Tu pedido está listo..."
- `PAYMENT_RECEIVED` → "We have received your payment..." / "Hemos recibido tu pago..."
- `PICKED_UP_AND_PAID` → "Your order has been picked up..." / "Tu pedido ha sido recogido..."

### Admin WhatsApp Messages

**File:** `src/components/admin/orders/OrderDetails.tsx`

- Status update messages use business language
- Order details labels translated
- Time formatting respects business language and time format settings

## Translation Structure

### Message Terms (WhatsApp)

Located in: `src/app/api/storefront/[slug]/order/route.ts`

```typescript
const messageTerms = {
  en: {
    RESTAURANT: {
      order: 'Order',
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      // ... more terms
    }
  },
  es: {
    RESTAURANT: {
      order: 'Pedido',
      subtotal: 'Subtotal',
      delivery: 'Entrega',
      // ... more terms
    }
  },
  sq: {
    // Albanian translations
  }
}
```

### Email Translations

Located in: `src/lib/customer-email-notification.ts`

- Status messages translated per language
- Email template HTML includes translated labels
- Date/time formatting uses locale-specific formats

## Setup Flow

### During Initial Setup

1. **Business Type Step** (`BusinessTypeStep.tsx`)
   - Language selector available (if Albanian user detected)
   - Default: English
   - Can select: English, Spanish, Albanian

2. **Store Creation Step** (`StoreCreationStep.tsx`)
   - WhatsApp number with country code
   - Language setting persists from previous step

### After Setup (Business Settings)

1. Navigate to **Settings → Business Settings**
2. Change language in dropdown
3. Toggle translation on/off
4. Save changes
5. All future customer communications use new language

## Testing

### Test Scenarios

1. **Spanish Business:**
   - Set language to Spanish
   - Enable translation
   - Place test order
   - Verify WhatsApp message in Spanish
   - Verify email notifications in Spanish
   - Verify item names remain unchanged

2. **Translation Disabled:**
   - Set language to Spanish
   - Disable translation
   - Place test order
   - Verify all content in English

3. **Mixed Content:**
   - Spanish business with English item names
   - Verify labels in Spanish, names in English

## Future Enhancements

- Add more languages (French, German, Italian, etc.)
- Per-language item name support
- Language-specific email templates
- Admin panel language selection
- Customer language preference detection

## API Endpoints

### Get Business Settings
```
GET /api/admin/stores/[businessId]/settings/business
```
Returns: `language`, `translateContentToBusinessLanguage`

### Update Business Settings
```
PUT /api/admin/stores/[businessId]/settings/business
```
Body: `{ language: "es", translateContentToBusinessLanguage: true }`

## Troubleshooting

### Content Not Translating

1. Check `translateContentToBusinessLanguage` is `true`
2. Verify `language` is set (not empty or null)
3. Check if translation exists in `messageTerms` for that language
4. Verify business type matches available translations

### Missing Translations

- System falls back to English if translation missing
- Add missing translations to `messageTerms` object
- Update email notification functions with new translations

## Notes

- Item names and business names are **never** translated automatically
- Customer-entered data (names, addresses, notes) is **never** translated
- Only system-generated labels and messages are translated
- Translation is applied at send time, not stored

