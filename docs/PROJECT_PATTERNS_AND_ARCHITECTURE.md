# WaveOrder Project Patterns & Architecture Guide

## 📋 Table of Contents
1. [API Route Patterns](#api-route-patterns)
2. [Component Patterns](#component-patterns)
3. [Database Schema Patterns](#database-schema-patterns)
4. [Design System Patterns](#design-system-patterns)
5. [Authentication & Authorization](#authentication--authorization)
6. [Error Handling](#error-handling)
7. [State Management](#state-management)
8. [File Organization](#file-organization)

---

## 🔌 API Route Patterns

### **Structure**
- **Location**: `src/app/api/[namespace]/[resource]/route.ts`
- **Namespaces**: 
  - `/api/admin/stores/[businessId]/...` - Admin operations
  - `/api/superadmin/...` - SuperAdmin operations
  - `/api/storefront/[slug]/...` - Public storefront APIs
  - `/api/v1/...` - External API (for integrations)
  - `/api/user/...` - User profile operations
  - `/api/auth/...` - Authentication
  - `/api/setup/...` - Setup wizard

### **Standard Pattern**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 2. Extract params/query
    const { searchParams } = new URL(request.url)
    const param = searchParams.get('param')

    // 3. Database query
    const data = await prisma.model.findMany({
      where: { /* conditions */ },
      include: { /* relations */ }
    })

    // 4. Return response
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
```

### **Key Patterns**
- ✅ **Always check authentication** at the start
- ✅ **Use PrismaClient singleton** pattern (via `@/lib/prisma`)
- ✅ **Return consistent JSON responses** with `NextResponse.json()`
- ✅ **Handle errors** with try/catch and appropriate status codes
- ✅ **Use async/await** for all async operations
- ✅ **Extract params** from `request.nextUrl.searchParams` or route params
- ✅ **Include relations** when needed using Prisma `include`

### **Dynamic Routes**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params // Note: params is a Promise in Next.js 15
  // ...
}
```

### **Business Access Pattern**
For admin routes, use `checkBusinessAccess()` helper:
```typescript
import { checkBusinessAccess } from '@/lib/api-helpers'

const access = await checkBusinessAccess(businessId)
if (!access.authorized) {
  return NextResponse.json({ message: access.error }, { status: access.status })
}
```

---

## 🎨 Component Patterns

### **Client Components**
- **Location**: `src/components/[namespace]/[ComponentName].tsx`
- **Always start with**: `'use client'`
- **Use TypeScript interfaces** for props

### **Standard Component Structure**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Icon1, Icon2 } from 'lucide-react'

interface ComponentProps {
  businessId: string
  onSuccess?: () => void
}

export function ComponentName({ businessId, onSuccess }: ComponentProps) {
  // 1. State declarations
  const [data, setData] = useState<DataType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 2. Effects
  useEffect(() => {
    fetchData()
  }, [businessId])

  // 3. Helper functions
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/endpoint/${businessId}`)
      if (!response.ok) throw new Error('Failed')
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  // 4. Render
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  return <MainContent data={data} />
}
```

### **SuperAdmin Component Pattern**
```typescript
// Header pattern
<div className="space-y-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
    <p className="text-gray-600 mt-1">Page description</p>
  </div>

  {/* Cards */}
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-teal-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Section Title</h2>
        <p className="text-sm text-gray-600">Section description</p>
      </div>
    </div>
    {/* Content */}
  </div>
</div>
```

### **State Management Patterns**
- ✅ **useState** for local component state
- ✅ **useEffect** for side effects and data fetching
- ✅ **No global state management** (Redux/Zustand) - keep it simple
- ✅ **Props drilling** is acceptable for simple cases
- ✅ **localStorage** for client-side persistence (cart, preferences)

### **Loading & Error States**
```typescript
// Loading pattern
{loading && (
  <div className="text-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
    <p className="text-gray-600">Loading...</p>
  </div>
)}

// Error pattern
{error && (
  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
    <AlertTriangle className="w-5 h-5 text-red-600" />
    <p className="text-sm text-red-700">{error}</p>
  </div>
)}
```

---

## 🗄️ Database Schema Patterns

### **Prisma Schema Structure**
- **Location**: `prisma/schema.prisma`
- **Database**: MongoDB (using Prisma ORM)
- **ID Pattern**: `@id @default(auto()) @map("_id") @db.ObjectId`

### **Model Patterns**
```prisma
model ModelName {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  field1    String
  field2    String?
  field3    Int      @default(0)
  
  // Relations
  relation  RelatedModel @relation(fields: [relationId], references: [id], onDelete: Cascade)
  
  // Timestamps (always include)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Indexes
  @@index([field1])
  @@unique([field1, field2])
}
```

### **Common Patterns**
- ✅ **Always include** `createdAt` and `updatedAt`
- ✅ **Use `@db.ObjectId`** for MongoDB ObjectIds
- ✅ **Use `onDelete: Cascade`** for dependent relations
- ✅ **Add indexes** for frequently queried fields
- ✅ **Use enums** for fixed sets of values
- ✅ **Optional fields** use `String?` syntax
- ✅ **Default values** where appropriate

### **Relation Patterns**
```prisma
// One-to-Many
model Business {
  products Product[]
}

model Product {
  businessId String @db.ObjectId
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
}

// Many-to-Many (via junction table)
model BusinessUser {
  businessId String @db.ObjectId
  userId     String @db.ObjectId
  business   Business @relation(fields: [businessId], references: [id])
  user       User @relation(fields: [userId], references: [id])
}
```

### **JSON Fields**
Use `Json?` type for flexible data:
```prisma
externalSystemEndpoints Json? // { products: "/products", categories: "/categories" }
externalBrandIds        Json? // Can be string or array
businessHours           Json? // Complex nested structure
```

---

## 🎨 Design System Patterns

### **Color Scheme**
- **Primary**: Teal (`bg-teal-600`, `text-teal-600`) - NOT blue
- **Secondary**: Purple (`bg-purple-600`, `text-purple-600`)
- **Success**: Green (`bg-green-100`, `text-green-800`)
- **Error**: Red (`bg-red-100`, `text-red-800`)
- **Warning**: Yellow (`bg-yellow-100`, `text-yellow-800`)
- **Neutral**: Gray (`bg-gray-50`, `text-gray-900`)

### **Card Pattern**
```tsx
<div className="bg-white rounded-lg border border-gray-200 p-6">
  {/* Content */}
</div>
```
- ✅ **Always use** `border border-gray-200` (NOT `shadow-sm`)
- ✅ **Padding**: `p-6` for main cards, `p-4` for smaller cards
- ✅ **Rounded**: `rounded-lg`

### **Page Layout Pattern**
```tsx
<div className="space-y-6">
  {/* Header */}
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Title</h1>
    <p className="text-gray-600 mt-1">Description</p>
  </div>

  {/* Content Cards */}
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    {/* Content */}
  </div>
</div>
```

### **Button Patterns**
```tsx
// Primary action (teal)
<button className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700">
  Action
</button>

// Secondary action
<button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
  Cancel
</button>

// Icon button
<button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
  <Icon className="w-4 h-4" />
</button>
```

### **Badge/Status Pattern**
```tsx
<span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
  isActive
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800'
}`}>
  {isActive ? 'Active' : 'Inactive'}
</span>
```

### **Icon Pattern**
```tsx
// Icon with colored background
<div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
  <Icon className="w-5 h-5 text-teal-600" />
</div>
```

### **Grid Patterns**
```tsx
// 2-column grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// 3-column grid
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

// 4-column grid
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

---

## 🔐 Authentication & Authorization

### **Session Pattern**
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
if (!session || session.user.role !== 'SUPER_ADMIN') {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
}
```

### **Role-Based Access**
- `SUPER_ADMIN` - Full platform access
- `BUSINESS_OWNER` - Business owner access
- `STAFF` - Limited business access

### **Middleware Protection**
Routes are protected via `src/middleware.ts`:
- `/superadmin/*` - Requires `SUPER_ADMIN` role
- `/admin/*` - Requires authenticated user
- `/auth/*` - Redirects authenticated users away

### **Business Access Helper**
```typescript
import { checkBusinessAccess } from '@/lib/api-helpers'

const access = await checkBusinessAccess(businessId)
// Returns: { authorized: boolean, session, isImpersonating?: boolean, error?, status? }
```

### **Impersonation Pattern**
SuperAdmins can impersonate businesses:
```typescript
// Check impersonation cookie
const impersonatingCookie = cookies().get('impersonating')
const isImpersonating = session.user.role === 'SUPER_ADMIN' && 
                        impersonatingCookie?.value === businessId
```

---

## ⚠️ Error Handling

### **Custom Error Classes**
Located in `src/lib/errors.ts`:
- `AppError` - Base error class
- `ValidationError` (400)
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `RateLimitError` (429)
- `BusinessError` (400)
- `DatabaseError` (500)

### **Error Handling Pattern**
```typescript
import { handleApiError } from '@/lib/api-error-handler'

try {
  // Operation
} catch (error) {
  return handleApiError(error, { context: 'additional info' })
}
```

### **Sentry Integration**
- Errors automatically logged to Sentry
- Operational errors (4xx) logged with context
- System errors (5xx) always logged

### **Client-Side Error Handling**
```typescript
try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed')
  }
} catch (error) {
  setError(error instanceof Error ? error.message : 'Failed')
}
```

---

## 📦 State Management

### **Component State**
- ✅ Use `useState` for local state
- ✅ Use `useEffect` for side effects
- ✅ Keep state as local as possible
- ✅ Lift state up when needed

### **Data Fetching Pattern**
```typescript
const [data, setData] = useState<DataType[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/endpoint')
      if (!response.ok) throw new Error('Failed')
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [dependencies])
```

### **Debouncing Pattern**
```typescript
const [searchQuery, setSearchQuery] = useState('')
const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearchQuery(searchQuery)
  }, 500)
  return () => clearTimeout(timer)
}, [searchQuery])
```

---

## 📁 File Organization

### **Directory Structure**
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── superadmin/        # SuperAdmin pages
│   └── [slug]/           # Public storefront pages
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── superadmin/       # SuperAdmin components
│   ├── storefront/      # Storefront components
│   └── auth/            # Auth components
├── lib/                  # Utilities & helpers
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client
│   ├── errors.ts        # Error classes
│   └── api-helpers.ts   # API utilities
└── types/               # TypeScript types
```

### **Naming Conventions**
- **Components**: PascalCase (`SuperAdminBusinesses.tsx`)
- **API Routes**: kebab-case (`route.ts`)
- **Utilities**: camelCase (`api-helpers.ts`)
- **Types/Interfaces**: PascalCase (`BusinessDetails`)

### **Component File Structure**
```
ComponentName.tsx
├── Imports (React, icons, types)
├── Interfaces/Types
├── Component function
│   ├── State declarations
│   ├── useEffect hooks
│   ├── Helper functions
│   └── Return JSX
└── Sub-components (if needed)
```

---

## 🔑 Key Principles

1. **Consistency First** - Follow existing patterns
2. **Type Safety** - Use TypeScript interfaces everywhere
3. **Error Handling** - Always handle errors gracefully
4. **Authentication** - Check auth at the start of API routes
5. **Design System** - Use teal/purple colors, border cards
6. **Simplicity** - Avoid over-engineering
7. **MongoDB + Prisma** - Use Prisma ORM for all DB operations
8. **Next.js App Router** - Use App Router patterns (not Pages Router)

---

## 📝 Common Patterns Summary

### **API Route Checklist**
- [ ] Import `NextRequest`, `NextResponse`
- [ ] Check authentication with `getServerSession`
- [ ] Extract params/query from request
- [ ] Use Prisma for database operations
- [ ] Return consistent JSON responses
- [ ] Handle errors with try/catch

### **Component Checklist**
- [ ] Start with `'use client'`
- [ ] Define TypeScript interfaces for props
- [ ] Use `useState` for state
- [ ] Use `useEffect` for data fetching
- [ ] Handle loading/error states
- [ ] Follow design system (teal colors, border cards)

### **Schema Checklist**
- [ ] Use `@id @default(auto()) @map("_id") @db.ObjectId`
- [ ] Include `createdAt` and `updatedAt`
- [ ] Add indexes for frequently queried fields
- [ ] Use `onDelete: Cascade` for relations
- [ ] Use `Json?` for flexible data structures

---

This guide should help maintain consistency across the codebase. When in doubt, check existing similar files for patterns!
