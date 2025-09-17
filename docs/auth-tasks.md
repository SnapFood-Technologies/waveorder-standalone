# WaveOrder Authentication Tasks

This document outlines authentication-related tasks including Google OAuth, optional name registration, and magic link functionality.

## 1. Google OAuth Integration

### 1.1 Google Provider Configuration
**Task:** Configure Google OAuth in NextAuth
- **Location:** `lib/auth.ts` or `app/api/auth/[...nextauth]/route.ts`
- **Description:** Add Google provider to NextAuth configuration
- **Implementation:**
```typescript
import GoogleProvider from 'next-auth/providers/google'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile'
        }
      }
    }),
    // ... existing providers
  ]
}
```

### 1.2 Google OAuth Environment Variables
**Task:** Add required environment variables
- **File:** `.env.local`
- **Variables:**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 1.3 Google Cloud Console Setup
**Task:** Configure OAuth application in Google Cloud Console
- **Steps:**
  1. Create new project or use existing
  2. Enable Google+ API
  3. Create OAuth 2.0 credentials
  4. Configure authorized redirect URIs
  5. Set up consent screen

### 1.4 Google Login Button Implementation
**Task:** Update login/register forms with Google option
- **Location:** 
  - `components/auth/LoginComponent.tsx`
  - `components/auth/RegisterComponent.tsx`
- **Implementation:** Google sign-in button with proper styling and error handling

### 1.5 Google OAuth User Handling
**Task:** Handle Google user data in database
- **Location:** `lib/auth.ts` callbacks
- **Description:** Process Google user info and create/update user records
- **Features:**
  - Extract name, email, profile image from Google
  - Handle existing users who sign up with Google
  - Merge accounts if email matches

## 2. Optional Name in Registration

### 2.1 Update Registration Form Validation
**Task:** Make name field optional in registration
- **Location:** `components/auth/RegisterComponent.tsx`
- **Changes:**
  - Remove `required` attribute from name input
  - Update form validation to allow empty name
  - Add placeholder suggesting name is optional

### 2.2 Update Registration API
**Task:** Handle optional name in registration endpoint
- **Location:** `app/api/auth/register/route.ts`
- **Changes:**
```typescript
// Remove name validation requirement
if (!email || !password) {
  return NextResponse.json(
    { message: 'Email and password are required' },
    { status: 400 }
  )
}

// Handle optional name
const user = await prisma.user.create({
  data: {
    name: name?.trim() || null, // Allow null names
    email: email.toLowerCase(),
    password: hashedPassword,
    // ... other fields
  }
})
```

### 2.3 Handle Missing Names in UI
**Task:** Display appropriate fallbacks for users without names
- **Locations:** Throughout the application
- **Implementation:**
  - Use email prefix as fallback display name
  - Show "User" or similar generic name
  - Prompt user to add name in profile settings

### 2.4 Profile Completion Prompts
**Task:** Encourage users to complete their profile
- **Location:** `components/profile/ProfileCompletion.tsx`
- **Description:** Subtle prompts to add missing profile information
- **Features:**
  - Profile completion percentage
  - Optional onboarding flow for missing info

## 3. Magic Link Functionality

### 3.1 Email Provider Configuration
**Task:** Configure NextAuth Email provider
- **Location:** `lib/auth.ts`
- **Description:** Set up email magic link provider
- **Implementation:**
```typescript
import EmailProvider from 'next-auth/providers/email'
import { sendMagicLinkEmail } from '@/lib/email'

export const authOptions = {
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        await sendMagicLinkEmail({
          to: identifier,
          magicLinkUrl: url
        })
      }
    })
  ]
}
```

### 3.2 Magic Link Email Template
**Task:** Create or update magic link email template
- **Location:** `lib/email.ts` (already exists - verify functionality)
- **Description:** Ensure magic link email template is working
- **Features:**
  - Professional email design
  - Clear call-to-action button
  - Fallback URL for email clients
  - Expiration notice

### 3.3 Magic Link UI Implementation
**Task:** Add magic link option to auth forms
- **Location:** `components/auth/LoginComponent.tsx`
- **Features:**
  - Email input for magic link
  - "Send Magic Link" button
  - Success state showing email sent
  - Resend functionality

### 3.4 Magic Link Success Page
**Task:** Create magic link sent confirmation page
- **Location:** `app/auth/verify-request/page.tsx`
- **Description:** Page shown after magic link is sent
- **Features:**
  - Confirmation message
  - Email checking instructions
  - Resend link option
  - Support contact info

### 3.5 Magic Link Error Handling
**Task:** Handle magic link errors gracefully
- **Scenarios:**
  - Expired magic link
  - Already used magic link
  - Invalid magic link
  - Email delivery failures

## 4. Authentication Flow Improvements

### 4.1 Unified Auth Experience
**Task:** Streamline authentication across all methods
- **Features:**
  - Consistent redirect handling after auth
  - Proper error states for all auth methods
  - Loading states during authentication
  - Success feedback

### 4.2 Account Linking
**Task:** Allow users to link multiple auth methods
- **Description:** Users can add Google/email to existing accounts
- **Implementation:** Account linking in profile settings
- **Scenarios:**
  - User registered with email, wants to add Google
  - User signed up with Google, wants to add password

### 4.3 Auth State Management
**Task:** Improve authentication state handling
- **Features:**
  - Proper loading states
  - Error boundary for auth errors
  - Automatic retry for failed auth attempts
  - Session persistence

## 5. Database Updates

### 5.1 User Model Updates
**Task:** Ensure User model supports all auth methods
- **Location:** `prisma/schema.prisma`
- **Current schema supports:** Google OAuth, email/password, magic links
- **Verification:** Ensure all auth flows work with existing schema

### 5.2 Account Linking Schema
**Task:** Verify Account model supports multiple providers per user
- **Current schema:** Already supports multiple accounts per user
- **Verification:** Test account linking functionality

## 6. Security Enhancements

### 6.1 Rate Limiting
**Task:** Add rate limiting to auth endpoints
- **Endpoints:**
  - Magic link requests
  - Password reset requests
  - Login attempts
- **Implementation:** Use middleware or rate limiting library

### 6.2 CSRF Protection
**Task:** Ensure CSRF protection is enabled
- **Location:** NextAuth configuration
- **Verification:** Confirm CSRF tokens are working

### 6.3 Secure Session Configuration
**Task:** Optimize session security settings
- **Configuration:**
  - Appropriate session max age
  - Secure cookie settings
  - JWT vs database sessions

## 7. User Experience Enhancements

### 7.1 Auth Form Improvements
**Task:** Enhance user experience on auth forms
- **Features:**
  - Real-time email validation
  - Password strength indicator
  - Clear error messages
  - Accessibility improvements

### 7.2 Social Auth Consistency
**Task:** Consistent branding for social auth buttons
- **Implementation:** 
  - Official Google button styles
  - Consistent button sizing
  - Loading states for social auth

### 7.3 Mobile Auth Experience
**Task:** Optimize authentication for mobile devices
- **Features:**
  - Touch-friendly button sizes
  - Proper keyboard types for inputs
  - Smooth transitions between auth states

## Implementation Priority

### Phase 1 (Core Auth Methods)
1. Configure Google OAuth provider
2. Make name optional in registration
3. Verify magic link functionality

### Phase 2 (Enhanced Experience)
1. Improve auth form UX
2. Add rate limiting
3. Account linking functionality

### Phase 3 (Advanced Features)
1. Profile completion prompts
2. Advanced security settings
3. Analytics on auth method usage

## Environment Variables Required

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Magic Link (if using SMTP)
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=your-resend-api-key

# Existing
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
EMAIL_FROM=noreply@waveorder.app
```

## Testing Scenarios

### Google OAuth Testing
- New user signs up with Google
- Existing user (email) signs in with Google
- Google account with same email as existing user

### Magic Link Testing
- Send magic link to new email
- Send magic link to existing user
- Click expired magic link
- Click used magic link

### Optional Name Testing
- Register without name
- Register with name
- Display names throughout app
- Profile completion prompts