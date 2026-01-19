# Third-Party Integrations

This document lists all third-party services and APIs integrated into the WaveOrder platform.

---

## 🔍 Analytics & Tracking

### Google Analytics
- **Purpose**: Website traffic and user behavior analysis
- **Component**: `src/components/site/GoogleAnalytics.tsx`
- **Environment Variable**: `NEXT_PUBLIC_GA_ID`
- **Status**: ✅ Active
- **Usage**: Page view tracking, user behavior analysis
- **Cookie Consent**: Included in cookie preferences
- **Integration**: Connected with Google Search Console (Google Webmaster Tools) for SEO insights and search performance data

### Microsoft Clarity
- **Purpose**: User session recordings and heatmaps
- **Component**: `src/components/site/MicrosoftClarity.tsx`
- **Environment Variable**: `NEXT_PUBLIC_CLARITY_ID`
- **Status**: ✅ Active
- **Usage**: Session recordings, heatmap analysis, user interaction tracking
- **Cookie Consent**: Included in cookie preferences

---

## 📧 Email Services

### Resend
- **Purpose**: Transactional email delivery
- **Location**: `src/lib/email.ts`, `src/lib/orderNotificationService.ts`
- **Environment Variable**: `RESEND_API_KEY`
- **Status**: ✅ Active
- **Usage**: 
  - Order notifications
  - Welcome emails
  - Password reset emails
  - Support message notifications
  - Team invitation emails
  - Contact form notifications
  - Low stock alerts
  - Verification emails

---

## 🔐 Authentication

### Google OAuth (NextAuth)
- **Purpose**: Sign in with Google account
- **Location**: `src/lib/auth.ts`
- **Environment Variables**: 
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- **Status**: ✅ Active
- **Usage**: 
  - User registration with Google
  - User login with Google
  - Account linking for existing email accounts
- **Components**: `src/components/auth/Login.tsx`, `src/components/auth/Register.tsx`

---

## 💳 Payment Processing

### Stripe
- **Purpose**: Subscription and payment processing
- **Location**: `src/lib/stripe.ts`, `src/lib/subscription.ts`
- **Environment Variables**: 
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_STARTER_PRICE_ID`
  - `STRIPE_STARTER_ANNUAL_PRICE_ID`
  - `STRIPE_PRO_PRICE_ID`
  - `STRIPE_PRO_ANNUAL_PRICE_ID`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Status**: ✅ Active
- **Usage**: 
  - Subscription management (Free, Pro plans)
  - Payment processing
  - Webhook handling for subscription events
  - Customer portal access

---

## 📦 File Storage

### Supabase Storage
- **Purpose**: Secure file storage for images and documents
- **Location**: `src/lib/supabase.ts`, `src/lib/userStorage.ts`, `src/lib/businessStorage.ts`
- **Environment Variables**: 
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- **Status**: ✅ Active
- **Usage**: 
  - Product images
  - Business logos
  - Category images
  - User profile images
  - Business settings images

---

## 🛡️ Spam Protection

### Akismet
- **Purpose**: Spam detection for contact forms
- **Location**: `src/lib/akismet.ts`
- **Environment Variable**: `AKISMET_API_KEY`
- **Status**: ✅ Active
- **Usage**: 
  - Spam checking for contact form submissions
  - Submit spam/ham feedback
  - API key verification
- **Integration**: `src/app/api/contact/route.ts`

---

## 🗺️ Maps & Location Services

### Google Maps API
- **Purpose**: Address autocomplete and location services
- **Location**: Multiple components (StoreFront, BusinessSettingsForm, CustomerForm, etc.)
- **Environment Variable**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Status**: ✅ Active
- **Usage**: 
  - Address autocomplete in order forms
  - Business address input
  - Customer address management
  - Delivery address validation
  - Google Maps links for delivery addresses

---

## 📋 Summary

| Service | Category | Status | Purpose |
|---------|----------|--------|---------|
| Google Analytics | Analytics | ✅ Active | Website traffic tracking |
| Microsoft Clarity | Analytics | ✅ Active | Session recordings & heatmaps |
| Resend | Email | ✅ Active | Transactional emails |
| Google OAuth | Authentication | ✅ Active | Social login |
| Stripe | Payments | ✅ Active | Subscription & payments |
| Supabase | Storage | ✅ Active | File storage |
| Akismet | Security | ✅ Active | Spam protection |
| Google Maps | Location | ✅ Active | Address autocomplete |

---

**Last Updated**: 10 January 2026  
**Lead Developer**: Griseld Gerveni

