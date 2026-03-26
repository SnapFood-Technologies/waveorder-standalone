import { isStorefrontPhoneComplete } from '@/lib/storefront-phone'

export type StorefrontDeliveryErrorState = {
  type: 'OUTSIDE_DELIVERY_AREA' | 'DELIVERY_NOT_AVAILABLE' | 'CALCULATION_FAILED'
  message: string
  maxDistance?: number
} | null

/** Single source of truth for storefront order readiness (cart checkout). */
export type StorefrontOrderValidationContext = {
  isTemporarilyClosed: boolean
  cartItemCount: number
  cartSubtotal: number
  cartTotal: number
  minimumOrder: number
  businessType: string
  deliveryType: 'delivery' | 'pickup' | 'dineIn'
  isOrderLoading: boolean
  forceScheduleMode: boolean
  storeIsOpen: boolean
  deliveryError: StorefrontDeliveryErrorState
  customerName: string
  customerPhone: string
  invoiceType: string
  invoiceAfm: string | undefined
  invoiceMinimumOrderValue: number | null | undefined
  customerAddress: string | undefined
  latitude: number | null | undefined
  longitude: number | null | undefined
  deliveryTime: string
  countryCode: string | undefined
  city: string | undefined
  postalPricingId: string | undefined
}

export const STOREFRONT_ORDER_BLOCKERS = [
  'STORE_CLOSED',
  'OUTSIDE_DELIVERY_AREA',
  'DELIVERY_UNAVAILABLE',
  'ORDER_LOADING',
  'CART_EMPTY',
  'MISSING_NAME_OR_PHONE',
  'PHONE_INVALID',
  'DELIVERY_ADDRESS_REQUIRED',
  'CONFIRM_DELIVERY_COORDINATES',
  'RETAIL_COUNTRY_REQUIRED',
  'RETAIL_CITY_REQUIRED',
  'RETAIL_POSTAL_PRICING_REQUIRED',
  'MINIMUM_ORDER_NOT_MET',
  'INVOICE_MINIMUM_NOT_MET',
  'INVOICE_AFM_INVALID',
  'SCHEDULE_TIME_REQUIRED'
] as const

export type StorefrontOrderBlocker = (typeof STOREFRONT_ORDER_BLOCKERS)[number]

function meetsDeliveryMinimum(ctx: StorefrontOrderValidationContext): boolean {
  return ctx.deliveryType !== 'delivery' || ctx.cartSubtotal >= ctx.minimumOrder
}

function addressNeedsCoordinatesConfirmation(ctx: StorefrontOrderValidationContext): boolean {
  return (
    ctx.deliveryType === 'delivery' &&
    ctx.businessType !== 'RETAIL' &&
    Boolean(ctx.customerAddress?.trim()) &&
    (ctx.latitude == null || ctx.longitude == null)
  )
}

/** All rules that must pass to enable the primary order button and submit. */
export function canSubmitStorefrontOrder(ctx: StorefrontOrderValidationContext): boolean {
  if (ctx.isTemporarilyClosed) return false
  if (ctx.cartItemCount === 0) return false
  if (!ctx.customerName?.trim() || !ctx.customerPhone?.trim()) return false
  if (!isStorefrontPhoneComplete(ctx.customerPhone)) return false
  if (ctx.isOrderLoading) return false

  if (ctx.deliveryType === 'delivery') {
    if (!ctx.customerAddress?.trim()) return false
    if (ctx.deliveryError?.type === 'OUTSIDE_DELIVERY_AREA') return false
    if (!meetsDeliveryMinimum(ctx) && !ctx.deliveryError) return false
    if (ctx.businessType !== 'RETAIL' && ctx.customerAddress?.trim() && (ctx.latitude == null || ctx.longitude == null)) {
      return false
    }
    if (ctx.businessType === 'RETAIL') {
      if (!ctx.countryCode?.trim()) return false
      if (!ctx.city?.trim()) return false
      if (!ctx.postalPricingId) return false
    }
  }

  if (ctx.invoiceType === 'INVOICE') {
    if (ctx.invoiceMinimumOrderValue != null && ctx.cartTotal < ctx.invoiceMinimumOrderValue) {
      return false
    }
    if (!ctx.invoiceAfm || ctx.invoiceAfm.length !== 9) return false
  }

  if (ctx.forceScheduleMode || (ctx.deliveryTime !== 'asap' && !ctx.storeIsOpen)) {
    if (!ctx.deliveryTime || ctx.deliveryTime === 'asap' || ctx.deliveryTime === '') {
      return false
    }
  }

  return true
}

/**
 * First blocking issue in UX order (button label / helper copy).
 * When this returns null, the order can be submitted (same as canSubmit === true).
 */
export function getPrimaryStorefrontOrderBlockerForDisplay(
  ctx: StorefrontOrderValidationContext
): StorefrontOrderBlocker | null {
  if (ctx.isTemporarilyClosed) return 'STORE_CLOSED'
  if (ctx.deliveryError?.type === 'OUTSIDE_DELIVERY_AREA') return 'OUTSIDE_DELIVERY_AREA'
  if (ctx.deliveryError) return 'DELIVERY_UNAVAILABLE'
  if (ctx.isOrderLoading) return 'ORDER_LOADING'
  if (ctx.cartItemCount === 0) return 'CART_EMPTY'
  if (!ctx.customerName?.trim() || !ctx.customerPhone?.trim()) return 'MISSING_NAME_OR_PHONE'
  if (!isStorefrontPhoneComplete(ctx.customerPhone)) return 'PHONE_INVALID'

  if (ctx.deliveryType === 'delivery') {
    if (!ctx.customerAddress?.trim()) return 'DELIVERY_ADDRESS_REQUIRED'
    if (addressNeedsCoordinatesConfirmation(ctx)) return 'CONFIRM_DELIVERY_COORDINATES'
    if (ctx.businessType === 'RETAIL') {
      if (!ctx.countryCode?.trim()) return 'RETAIL_COUNTRY_REQUIRED'
      if (!ctx.city?.trim()) return 'RETAIL_CITY_REQUIRED'
      if (!ctx.postalPricingId) return 'RETAIL_POSTAL_PRICING_REQUIRED'
    }
    if (!meetsDeliveryMinimum(ctx) && !ctx.deliveryError) return 'MINIMUM_ORDER_NOT_MET'
  }

  if (ctx.invoiceType === 'INVOICE') {
    if (ctx.invoiceMinimumOrderValue != null && ctx.cartTotal < ctx.invoiceMinimumOrderValue) {
      return 'INVOICE_MINIMUM_NOT_MET'
    }
    if (!ctx.invoiceAfm || ctx.invoiceAfm.length !== 9) return 'INVOICE_AFM_INVALID'
  }

  if (ctx.forceScheduleMode || (ctx.deliveryTime !== 'asap' && !ctx.storeIsOpen)) {
    if (!ctx.deliveryTime || ctx.deliveryTime === 'asap' || ctx.deliveryTime === '') {
      return 'SCHEDULE_TIME_REQUIRED'
    }
  }

  return null
}

/** User-facing primary button label (matches `getPrimaryStorefrontOrderBlockerForDisplay`). */
export function formatStorefrontOrderButtonLabel(
  ctx: StorefrontOrderValidationContext,
  translations: Record<string, string | undefined>,
  currencySymbol: string
): string {
  const blocker = getPrimaryStorefrontOrderBlockerForDisplay(ctx)
  if (blocker === null) {
    return `${translations.orderViaWhatsapp || 'Order via WhatsApp'} - ${currencySymbol}${ctx.cartTotal.toFixed(2)}`
  }
  switch (blocker) {
    case 'STORE_CLOSED':
      return translations.storeTemporarilyClosed || 'Store Temporarily Closed'
    case 'OUTSIDE_DELIVERY_AREA':
      return translations.outsideDeliveryArea || 'Address Outside Delivery Area'
    case 'DELIVERY_UNAVAILABLE':
      return translations.deliveryNotAvailable || 'Delivery Not Available'
    case 'ORDER_LOADING':
      return translations.placingOrder || 'Placing Order...'
    case 'CART_EMPTY':
      return translations.addItemsToCart || 'Add items to cart'
    case 'MISSING_NAME_OR_PHONE':
      return translations.fillRequiredInfo || 'Fill required information'
    case 'PHONE_INVALID':
      return translations.invalidPhone || 'Please enter a valid phone number'
    case 'DELIVERY_ADDRESS_REQUIRED':
      return translations.addDeliveryAddress || 'Add delivery address'
    case 'CONFIRM_DELIVERY_COORDINATES':
      return translations.confirmDeliveryAddress || 'Confirm your delivery address'
    case 'RETAIL_COUNTRY_REQUIRED':
      return translations.selectCountry || 'Please select a country'
    case 'RETAIL_CITY_REQUIRED':
      return translations.selectCity || 'Please select a city'
    case 'RETAIL_POSTAL_PRICING_REQUIRED':
      return translations.pleaseSelectDeliveryMethod || 'Please select a delivery method'
    case 'MINIMUM_ORDER_NOT_MET':
      return `${translations.minimumOrder || 'Minimum order'} ${currencySymbol}${ctx.minimumOrder.toFixed(2)}`
    case 'INVOICE_MINIMUM_NOT_MET': {
      const minAmount = `${currencySymbol}${(ctx.invoiceMinimumOrderValue ?? 0).toFixed(2)}`
      return (
        translations.invoiceMinimumOrderError?.replace('{amount}', minAmount) ||
        `To select Invoice, your order must be at least ${minAmount}`
      )
    }
    case 'INVOICE_AFM_INVALID':
      return translations.enterValidTaxId || 'Please enter a valid Tax ID (9 digits)'
    case 'SCHEDULE_TIME_REQUIRED':
      return translations.selectTimeForSchedule || 'Select time for schedule'
    default:
      return translations.fillRequiredInfo || 'Fill required information'
  }
}

/** Short hint below the order button (footer line). */
export function formatStorefrontOrderFooterHint(
  ctx: StorefrontOrderValidationContext,
  translations: Record<string, string | undefined>
): string {
  const blocker = getPrimaryStorefrontOrderBlockerForDisplay(ctx)
  if (ctx.isTemporarilyClosed) {
    return translations.storeClosedMessage || 'We apologize for any inconvenience.'
  }
  if (ctx.deliveryError?.type === 'OUTSIDE_DELIVERY_AREA') {
    return translations.selectDifferentArea || 'Please select an address within our delivery area'
  }
  if (blocker === 'CONFIRM_DELIVERY_COORDINATES') {
    return translations.selectAddressFromSuggestions || 'Please type and select your address from the suggestions'
  }
  if (blocker === 'SCHEDULE_TIME_REQUIRED') {
    return translations.selectTimeForSchedule || 'Please select a time for your scheduled order'
  }
  return translations.clickingButton || 'By clicking this button, you agree to place your order via WhatsApp.'
}

/** Toast / alert message when submit is blocked (same rules as button). */
export function getStorefrontOrderSubmitErrorMessage(
  blocker: StorefrontOrderBlocker,
  translations: Record<string, string | undefined>,
  params: {
    currencySymbol: string
    minimumOrder: number
    invoiceMinimumOrderValue?: number | null
  }
): string {
  const { currencySymbol, minimumOrder, invoiceMinimumOrderValue } = params
  switch (blocker) {
    case 'STORE_CLOSED':
      return translations.storeTemporarilyClosed || 'Store is temporarily closed'
    case 'OUTSIDE_DELIVERY_AREA':
      return translations.outsideDeliveryArea || 'Address is outside the delivery area'
    case 'DELIVERY_UNAVAILABLE':
      return translations.deliveryNotAvailable || 'Delivery is not available for this address'
    case 'ORDER_LOADING':
      return translations.placingOrder || 'Please wait...'
    case 'CART_EMPTY':
      return translations.addItemsToCart || 'Add items to your cart first'
    case 'MISSING_NAME_OR_PHONE':
      return translations.fillRequiredInfo || 'Please fill in required customer information'
    case 'PHONE_INVALID':
      return translations.invalidPhone || 'Please enter a valid phone number'
    case 'DELIVERY_ADDRESS_REQUIRED':
      return translations.addDeliveryAddress || 'Please provide a delivery address'
    case 'CONFIRM_DELIVERY_COORDINATES':
      return translations.confirmAddressAbove || 'Please confirm your delivery address above'
    case 'RETAIL_COUNTRY_REQUIRED':
      return 'Please select a country'
    case 'RETAIL_CITY_REQUIRED':
      return 'Please select a city'
    case 'RETAIL_POSTAL_PRICING_REQUIRED':
      return translations.pleaseSelectDeliveryMethod || 'Please select a delivery method'
    case 'MINIMUM_ORDER_NOT_MET':
      return `${translations.minimumOrder || 'Minimum order'} ${currencySymbol}${minimumOrder.toFixed(2)} ${translations.forDelivery || 'for delivery'}`
    case 'INVOICE_MINIMUM_NOT_MET': {
      const minAmount = `${currencySymbol}${(invoiceMinimumOrderValue ?? 0).toFixed(2)}`
      return (
        translations.invoiceMinimumOrderError?.replace('{amount}', minAmount) ||
        `To select Invoice, your order must be at least ${minAmount}`
      )
    }
    case 'INVOICE_AFM_INVALID':
      return translations.enterValidTaxId || 'Please enter a valid Tax ID (9 digits)'
    case 'SCHEDULE_TIME_REQUIRED':
      return translations.selectTimeForSchedule || 'Please select a time for your scheduled order'
    default:
      return translations.failedToSubmitOrder || 'Unable to submit order. Please check your details.'
  }
}
