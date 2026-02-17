# Salon StoreFront Alignment with StoreFront

**Status:** 📋 Planning  
**Priority:** HIGH  
**Goal:** Match StoreFront quality (70-80% feature parity) adapted for salons

---

## 🎯 Overview

The StoreFront component has been perfected over months with:
- ✅ Responsive design (mobile/desktop/tablet)
- ✅ Optimized load times & performance
- ✅ Advanced filtering & search
- ✅ SEO optimization
- ✅ Analytics & tracking (UTM, IP detection, visitor sessions)
- ✅ Smooth UX/animations
- ✅ Error handling & edge cases

**SalonStoreFront needs to inherit these optimizations** while adapting for services/appointments instead of products/orders.

---

## 📋 CHANGES NEEDED

### 1. HEADER & SEO ⚠️ CRITICAL

#### Current Issues:
- ❌ No SEO meta tags (og:image, twitter:card, etc.)
- ❌ Cover image styling doesn't match StoreFront (missing responsive heights, background positioning)
- ❌ Description placement/logic differs
- ❌ Missing appearance editor customization options

#### Changes Required:
- [ ] **Add SEO Head component** (matching StoreFront)
  - Meta tags: title, description, og:image, og:url, twitter:card
  - Use coverImage for og:image
  - Dynamic meta based on storeData
- [ ] **Match cover image styling** from StoreFront
  - Support `coverHeight`, `coverHeightMobile`, `coverHeightDesktop`
  - Support `coverBackgroundSize`, `coverBackgroundPosition`
  - Support `logoPadding`, `logoObjectFit`
  - Responsive heights (mobile vs desktop)
- [ ] **Match header description logic**
  - Same positioning and styling as StoreFront
  - Support multilingual descriptions (descriptionAl, descriptionEl)
  - Same text styling and spacing

---

### 2. SEARCH LOGIC ⚠️ CRITICAL

#### Current Issues:
- ❌ Basic search only (no debouncing)
- ❌ No search result count display
- ❌ No "no results" messaging matching StoreFront
- ❌ Missing search analytics tracking

#### Changes Required:
- [ ] **Implement debounced search** (matching StoreFront)
  - Use `debouncedSearchTerm` state
  - 500ms debounce delay
  - Prevent excessive API calls
- [ ] **Add search result display**
  - Show "X results for 'search term'"
  - Match StoreFront's result count UI
- [ ] **Match "no results" state**
  - Same empty state design
  - "Try different search" messaging
  - "Browse all services" link
- [ ] **Add search analytics tracking**
  - Track search queries via `/api/storefront/[slug]/track`
  - Include UTM params in tracking
  - Track search → view → booking conversion

---

### 3. CATEGORY LOGIC ⚠️ CRITICAL

#### Current Issues:
- ❌ Basic category filtering only
- ❌ No subcategory support
- ❌ No category icons/images
- ❌ Missing category analytics

#### Changes Required:
- [ ] **Match category structure** from StoreFront
  - Support subcategories (if needed for salons)
  - Category icons/images display
  - Category sorting (sortOrder)
- [ ] **Match category UI**
  - Same scrollable category bar
  - Same active state styling
  - Same hover effects
- [ ] **Add category analytics**
  - Track category clicks
  - Track category → service view conversion

---

### 4. FILTER LOGIC ⚠️ CRITICAL

#### Current Issues:
- ❌ NO FILTER MODAL (missing entirely!)
- ❌ No sorting options
- ❌ No price range filtering
- ❌ No duration filtering (salon-specific)

#### Changes Required:
- [ ] **Add Filter Modal** (matching StoreFront structure)
  - Filter by: Duration, Price Range, Category
  - Sort by: Name (A-Z, Z-A), Price (Low-High, High-Low), Duration
  - Same modal UI/UX as StoreFront
  - Mobile-friendly filter drawer
- [ ] **Implement filter state management**
  - `showFilterModal` state
  - `sortBy` state
  - Filter persistence (URL params or localStorage)
- [ ] **Add filter UI components**
  - Filter button in header
  - Active filter badges
  - Clear filters button
  - Filter count indicator

---

### 5. SERVICE CARDS vs PRODUCT CARDS ⚠️ CRITICAL

#### Current Issues:
- ❌ Different card layout/styling
- ❌ Missing hover effects
- ❌ Missing stock badges (for salons: availability badges)
- ❌ Missing discount badges
- ❌ Missing image lazy loading
- ❌ Missing share button on cards

#### Changes Required:
- [ ] **Match card structure** from StoreFront
  - Same aspect ratio for images
  - Same padding/spacing
  - Same border radius and shadows
  - Same hover effects (scale, shadow)
- [ ] **Add service-specific badges**
  - Duration badge (instead of stock badge)
  - "Popular" or "Featured" badge (if applicable)
  - Discount badge (if originalPrice exists)
- [ ] **Implement image optimization**
  - Lazy loading for service images
  - Image placeholder while loading
  - Responsive image sizes
- [ ] **Add share button to cards**
  - Share icon overlay on hover
  - Same share functionality as StoreFront
- [ ] **Match card grid responsiveness**
  - Same breakpoints (mobile: 2 cols, tablet: 3 cols, desktop: 4 cols)
  - Same gap spacing

---

### 6. SERVICE MODAL vs PRODUCT MODAL ⚠️ CRITICAL

#### Current Issues:
- ❌ Different modal structure
- ❌ Missing image gallery/carousel
- ❌ Missing image navigation (prev/next)
- ❌ Missing image dots indicator
- ❌ Different button styling
- ❌ Missing modifier support display

#### Changes Required:
- [ ] **Match modal structure** from StoreFront
  - Same header layout (title, share button, close button)
  - Same scrollable content area
  - Same footer with CTA button
- [ ] **Add image gallery** (if service has multiple images)
  - Image carousel with prev/next arrows
  - Image dots indicator
  - Image counter (1/3, 2/3, etc.)
  - Swipe support on mobile
- [ ] **Match modal styling**
  - Same max-width and responsive behavior
  - Same backdrop blur/opacity
  - Same animation (fade in)
  - Same close button positioning
- [ ] **Add service details display**
  - Duration prominently displayed
  - Description formatting (same as product modal)
  - Price display (same styling)
  - Modifiers/add-ons display (if applicable)

---

### 7. BOOKING MODAL vs CART MODAL ⚠️ CRITICAL

#### Current Issues:
- ❌ Different modal structure
- ❌ Missing mobile bottom sheet style
- ❌ Missing desktop sidebar style
- ❌ Different item display
- ❌ Missing quantity controls matching StoreFront
- ❌ Missing total calculation display

#### Changes Required:
- [ ] **Match modal structure** from StoreFront
  - **Mobile**: Bottom sheet style (slides up from bottom)
  - **Desktop**: Sidebar style (slides in from right)
  - Same responsive breakpoints
- [ ] **Match item display**
  - Same item card layout
  - Same quantity controls (+/- buttons)
  - Same remove button styling
  - Same price display per item
- [ ] **Match summary section**
  - Same subtotal display
  - Same total display (large, bold)
  - Same CTA button styling
  - Same empty state message
- [ ] **Add booking-specific features**
  - Date/time selection (already exists, but match styling)
  - Customer info form (match StoreFront form styling)
  - Same validation and error handling

---

### 8. ANALYTICS & TRACKING ⚠️ CRITICAL

#### Current Issues:
- ❌ Missing UTM parameter tracking
- ❌ Missing IP detection & geolocation
- ❌ Missing visitor session tracking
- ❌ Missing product/service view tracking
- ❌ Missing conversion tracking

#### Changes Required:
- [ ] **Add visitor session tracking**
  - Track on page load via `/api/storefront/[slug]/track`
  - Include UTM params (utm_source, utm_medium, utm_campaign, etc.)
  - Include IP address & geolocation
  - Include referrer data
  - Include device/browser info
- [ ] **Add service view tracking**
  - Track when service modal opens
  - Track service share clicks
  - Track service → booking conversion
- [ ] **Add booking tracking**
  - Track booking submissions
  - Track booking completion
  - Track booking cancellation
- [ ] **Add appointment logging** (matching order logging)
  - Log `appointment_created` when appointment is created (storefront, admin, API)
  - Log `appointment_error` when appointment creation/update fails
  - Include metadata: appointmentId, orderId, customerId, businessId, status, etc.
  - Track in SystemLogs page (already has UI, needs API stats calculation)
- [x] **Add appointment system logs** (matching order logs) ✅ COMPLETED
  - ✅ Added `appointment_created` and `appointment_error` to LogType in `systemLog.ts`
  - ✅ Log appointment creation via `logSystemEvent` with `logType: 'appointment_created'`
  - ✅ Log appointment status changes (REQUESTED → CONFIRMED → COMPLETED, etc.)
  - ✅ Log appointment errors via `logType: 'appointment_error'`
  - ✅ Include metadata: appointmentId, orderId, customerId, status, staffId, appointmentDate, etc.
  - ✅ Include IP address, user agent, referrer (same as order logs)
  - ✅ Logging implemented in all appointment endpoints:
    - ✅ `/api/storefront/[slug]/order` (POST) - Creates appointment for SALON businesses
    - ✅ `/api/admin/stores/[businessId]/appointments` (POST)
    - ✅ `/api/admin/stores/[businessId]/appointments/[appointmentId]` (PUT)
    - ✅ `/api/v1/appointments` (POST, PUT)
  - ✅ System logs page updated to show appointment stats
  - ✅ Appointment log types added to filter dropdown
- [ ] **Add UTM parameter handling**
  - Parse UTM params from URL
  - Store in localStorage (for session persistence)
  - Include in all tracking calls
- [ ] **Add share link tracking**
  - Track when service share link is clicked
  - Track `productShareId` (serviceShareId) in visitor sessions
  - Track share → view → booking conversion

---

### 9. PERFORMANCE OPTIMIZATIONS ⚠️ CRITICAL

#### Current Issues:
- ❌ No code splitting
- ❌ No image lazy loading
- ❌ No infinite scroll/pagination
- ❌ No memoization
- ❌ No debouncing

#### Changes Required:
- [ ] **Implement infinite scroll** (matching StoreFront)
  - Load services in batches (e.g., 20 at a time)
  - Load more on scroll (within 800px of bottom)
  - Show loading indicator
  - Prevent duplicate loads
- [ ] **Add React optimizations**
  - `useMemo` for filtered services
  - `useCallback` for event handlers
  - `React.memo` for service cards (if needed)
- [ ] **Optimize image loading**
  - Lazy load images (Intersection Observer)
  - Use Next.js Image component (if possible)
  - Image placeholders
- [ ] **Optimize API calls**
  - Debounce search (already mentioned)
  - Cache category data
  - Prevent duplicate fetches

---

### 10. RESPONSIVE DESIGN ⚠️ CRITICAL

#### Current Issues:
- ❌ Different breakpoints than StoreFront
- ❌ Missing mobile optimizations
- ❌ Missing tablet optimizations
- ❌ Different touch interactions

#### Changes Required:
- [ ] **Match breakpoints** from StoreFront
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- [ ] **Match mobile optimizations**
  - Touch-friendly buttons (min 44x44px)
  - Swipe gestures for modals
  - Bottom sheet modals on mobile
  - Sticky header/footer
- [ ] **Match tablet optimizations**
  - Grid layout adjustments
  - Modal sizing
  - Touch interactions
- [ ] **Match desktop optimizations**
  - Hover states
  - Keyboard navigation
  - Sidebar modals

---

### 11. ERROR HANDLING & EDGE CASES ⚠️ CRITICAL

#### Current Issues:
- ❌ Basic error handling
- ❌ Missing loading states
- ❌ Missing empty states
- ❌ Missing error boundaries

#### Changes Required:
- [ ] **Match error handling** from StoreFront
  - Try/catch blocks for all async operations
  - User-friendly error messages
  - Error retry mechanisms
  - Error logging
- [ ] **Match loading states**
  - Skeleton loaders for services
  - Loading spinners
  - Disabled states during loading
- [ ] **Match empty states**
  - No services found
  - No search results
  - Empty booking cart
  - Closed business state
- [ ] **Add error boundaries**
  - React Error Boundary component
  - Fallback UI
  - Error reporting

---

### 12. APPEARANCE EDITOR CHANGES ⚠️ IMPORTANT

#### Current Issues:
- ❌ Copy/text still references "restaurant" terminology
- ❌ Missing salon-specific appearance options

#### Changes Required:
- [ ] **Update appearance editor copy**
  - Change "Products" → "Services" in labels
  - Change "Orders" → "Appointments" in labels
  - Change "Add to Cart" → "Add to Booking"
  - Change "Cart" → "Booking"
  - Update help text and tooltips
- [ ] **Add salon-specific options**
  - Service duration display options
  - Staff selection display options
  - Appointment time display options
- [ ] **Update preview**
  - Show salon-specific preview
  - Update preview text/copy

---

### 13. ADDITIONAL FEATURES TO INHERIT

#### From StoreFront (to add):
- [ ] **Legal Pages Modal**
  - Same modal component
  - Same styling
  - Same footer integration
- [ ] **Business Info Modal**
  - Same modal component
  - Same contact info display
  - Same map integration (if address exists)
- [ ] **Share Modal**
  - Social media sharing
  - Copy link functionality
  - Same styling
- [ ] **Scroll to top button**
  - Same button styling
  - Same scroll behavior
  - Same visibility logic
- [ ] **Loading optimizations**
  - Same loading indicators
  - Same skeleton loaders
  - Same progressive loading

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1: CRITICAL (Must Have)
1. Header & SEO
2. Search Logic
3. Category Logic
4. Filter Logic
5. Service Cards
6. Service Modal
7. Booking Modal
8. Analytics & Tracking

### Phase 2: IMPORTANT (Should Have)
9. Performance Optimizations
10. Responsive Design
11. Error Handling
12. Appearance Editor Changes

### Phase 3: NICE TO HAVE
13. Additional Features

---

## 📝 NOTES

- **Keep delivery-specific features OUT**: No delivery time, delivery fee, minimum order, etc.
- **Adapt for services**: Duration instead of stock, appointments instead of orders
- **Maintain 70-80% match**: Core UX/UI should feel familiar
- **Preserve optimizations**: Don't regress on performance gains
- **Test thoroughly**: Mobile, tablet, desktop, different browsers

---

## ✅ VALIDATION CHECKLIST

After implementation, verify:
- [ ] Page load time < 3s on 3G
- [ ] All modals work on mobile/desktop
- [ ] Search is debounced and tracks analytics
- [ ] Filters work and persist state
- [ ] Service cards match product cards visually
- [ ] UTM tracking works
- [ ] IP detection works
- [ ] Visitor sessions are tracked
- [ ] Responsive on all devices
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Appearance editor shows salon-specific copy
- [x] Appointment logging works (✅ COMPLETED)
- [x] System logs page shows appointment stats (✅ COMPLETED)

---

## ✅ COMPLETED ITEMS

### Appointment Logging System ✅
- [x] Added `appointment_created` and `appointment_error` log types
- [x] Implemented logging in all appointment creation endpoints
- [x] Implemented logging in all appointment update endpoints
- [x] Added appointment stats calculation in system logs API
- [x] Added appointment stats display card in system logs UI
- [x] Added appointment log type labels
- [x] Storefront order endpoint creates appointments for SALON businesses
- [x] Appointment creation includes full metadata (appointmentId, orderId, customerId, status, duration, etc.)

---

**Estimated Effort:** 2-3 weeks (matching StoreFront quality level)
