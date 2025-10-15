#!/bin/bash

# WaveOrder Project Setup Script
echo "🌊 Setting up WaveOrder project..."

# Create project directory
mkdir waveorder
cd waveorder

# Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install additional dependencies
echo "📦 Installing dependencies..."
npm install prisma @prisma/client @auth/prisma-adapter next-auth bcryptjs
npm install @types/bcryptjs --save-dev
npm install lucide-react @headlessui/react @heroicons/react
npm install resend @types/node
npm install class-variance-authority clsx tailwind-merge
npm install react-hook-form @hookform/resolvers zod
npm install date-fns

# Initialize Prisma
npx prisma init

# Create environment variables
cat > .env.local << 'EOF'
# Database
DATABASE_URL="mongodb://localhost:27017/waveorder"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Cron Jobs
CRON_SECRET="your-cron-secret-key-here"

# Resend
RESEND_API_KEY="your-resend-api-key"

# Payment Gateways
STRIPE_PUBLIC_KEY="your-stripe-public-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
PAYPAL_CLIENT_ID="your-paypal-client-id"
BKT_API_KEY="your-bkt-api-key"

# WhatsApp
WHATSAPP_API_URL="https://api.whatsapp.com"
EOF

# Create Prisma schema
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(auto()) @map("_id") @db.ObjectId
  userId            String  @db.ObjectId
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.String
  access_token      String? @db.String
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.String
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  sessionToken String   @unique
  userId       String   @db.ObjectId
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          UserRole  @default(BUSINESS_OWNER)
  accounts      Account[]
  sessions      Session[]
  businesses    BusinessUser[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Business {
  id                String         @id @default(auto()) @map("_id") @db.ObjectId
  name              String
  slug              String         @unique
  description       String?
  logo              String?
  coverImage        String?
  phone             String?
  email             String?
  address           String?
  website           String?
  whatsappNumber    String
  businessType      BusinessType   @default(RESTAURANT)
  subscriptionPlan  SubscriptionPlan @default(FREE)
  subscriptionStatus SubscriptionStatus @default(ACTIVE)
  
  // Branding
  primaryColor      String         @default("#3B82F6")
  secondaryColor    String         @default("#1F2937")
  fontFamily        String         @default("Inter")
  
  // Settings
  currency          String         @default("USD")
  timezone          String         @default("UTC")
  language          String         @default("en")
  deliveryFee       Float          @default(0)
  minimumOrder      Float          @default(0)
  deliveryRadius    Float          @default(10)
  
  // Payment settings
  paymentMethods    PaymentMethod[]
  paymentInstructions String?
  
  // WhatsApp settings
  messageTemplate   String?
  autoReply         Boolean        @default(false)
  autoReplyMessage  String?
  
  users             BusinessUser[]
  categories        Category[]
  products          Product[]
  orders            Order[]
  customers         Customer[]
  analytics         Analytics[]
  
  isActive          Boolean        @default(true)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model BusinessUser {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  userId     String   @db.ObjectId
  businessId String   @db.ObjectId
  role       BusinessRole @default(STAFF)
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([userId, businessId])
}

model Category {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  description String?
  image       String?
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  businessId  String    @db.ObjectId
  
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  products    Product[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Product {
  id          String      @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  description String?
  images      String[]
  price       Float
  originalPrice Float?
  sku         String?
  stock       Int         @default(0)
  isActive    Boolean     @default(true)
  featured    Boolean     @default(false)
  
  categoryId  String      @db.ObjectId
  businessId  String      @db.ObjectId
  
  category    Category    @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  business    Business    @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  variants    ProductVariant[]
  modifiers   ProductModifier[]
  orderItems  OrderItem[]
  
  // SEO
  metaTitle   String?
  metaDescription String?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model ProductVariant {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  price       Float
  stock       Int      @default(0)
  sku         String?
  productId   String   @db.ObjectId
  
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems  OrderItem[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProductModifier {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  price       Float    @default(0)
  required    Boolean  @default(false)
  productId   String   @db.ObjectId
  
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Customer {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  phone       String
  email       String?
  address     String?
  businessId  String   @db.ObjectId
  
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  orders      Order[]
  
  // Customer tier for wholesale pricing
  tier        CustomerTier @default(REGULAR)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([phone, businessId])
}

model Order {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  orderNumber     String      @unique
  status          OrderStatus @default(PENDING)
  type            OrderType   @default(DELIVERY)
  
  customerId      String      @db.ObjectId
  businessId      String      @db.ObjectId
  
  customer        Customer    @relation(fields: [customerId], references: [id], onDelete: Cascade)
  business        Business    @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  items           OrderItem[]
  
  // Pricing
  subtotal        Float
  deliveryFee     Float       @default(0)
  tax             Float       @default(0)
  discount        Float       @default(0)
  total           Float
  
  // Delivery info
  deliveryAddress String?
  deliveryTime    DateTime?
  notes           String?
  
  // Payment
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   String?
  
  // WhatsApp
  whatsappMessageId String?
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model OrderItem {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  quantity    Int
  price       Float
  
  orderId     String   @db.ObjectId
  productId   String   @db.ObjectId
  variantId   String?  @db.ObjectId
  
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  variant     ProductVariant? @relation(fields: [variantId], references: [id])
  
  modifiers   String[] // JSON array of selected modifiers
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Analytics {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId  String   @db.ObjectId
  date        DateTime
  
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  // Metrics
  visitors    Int      @default(0)
  orders      Int      @default(0)
  revenue     Float    @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([businessId, date])
}

enum UserRole {
  SUPER_ADMIN
  BUSINESS_OWNER
  STAFF
}

enum BusinessRole {
  OWNER
  MANAGER
  STAFF
}

enum BusinessType {
  RESTAURANT
  CAFE
  RETAIL
  JEWELRY
  FLORIST
  GROCERY
  OTHER
}

enum SubscriptionPlan {
  FREE
  BASIC
  PREMIUM
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  INACTIVE
  CANCELLED
  EXPIRED
}

enum PaymentMethod {
  CASH_ON_DELIVERY
  BANK_TRANSFER
  STRIPE
  PAYPAL
  BKT
  MOBILE_WALLET
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  REFUNDED
}

enum OrderType {
  DELIVERY
  PICKUP
  DINE_IN
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum CustomerTier {
  REGULAR
  VIP
  WHOLESALE
}
EOF

# Create lib utilities
mkdir -p src/lib
cat > src/lib/prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
EOF

cat > src/lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `WO-${timestamp}-${random}`.toUpperCase()
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatWhatsAppMessage(order: any): string {
  let message = `🛍️ *New Order #${order.orderNumber}*\n\n`
  message += `👤 *Customer:* ${order.customer.name}\n`
  message += `📞 *Phone:* ${order.customer.phone}\n\n`
  
  message += `📋 *Items:*\n`
  order.items.forEach((item: any) => {
    message += `• ${item.quantity}x ${item.product.name}`
    if (item.variant) {
      message += ` (${item.variant.name})`
    }
    message += ` - ${formatCurrency(item.price * item.quantity)}\n`
  })
  
  message += `\n💰 *Total:* ${formatCurrency(order.total)}\n`
  
  if (order.type === 'DELIVERY' && order.deliveryAddress) {
    message += `🚚 *Delivery Address:* ${order.deliveryAddress}\n`
  }
  
  if (order.notes) {
    message += `📝 *Notes:* ${order.notes}\n`
  }
  
  return message
}
EOF

# Create app structure
mkdir -p src/app/{site,dashboard}

# Site pages (public website)
mkdir -p src/app/site/{about,pricing,contact,faq}

# Site layout
cat > src/app/site/layout.tsx << 'EOF'
import { Inter } from 'next/font/google'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'

const inter = Inter({ subsets: ['latin'] })

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </div>
  )
}
EOF

# Site home page
cat > src/app/site/page.tsx << 'EOF'
import Hero from '@/components/site/Hero'
import Features from '@/components/site/Features'
import Testimonials from '@/components/site/Testimonials'
import CTA from '@/components/site/CTA'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Testimonials />
      <CTA />
    </>
  )
}
EOF

# Dashboard layout
cat > src/app/dashboard/layout.tsx << 'EOF'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'

const inter = Inter({ subsets: ['latin'] })

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} flex h-screen bg-gray-50`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
EOF

# Dashboard pages
mkdir -p src/app/dashboard/{products,orders,customers,analytics,settings}

cat > src/app/dashboard/page.tsx << 'EOF'
import DashboardOverview from '@/components/dashboard/DashboardOverview'

export default function DashboardPage() {
  return <DashboardOverview />
}
EOF

cat > src/app/dashboard/products/page.tsx << 'EOF'
import ProductsTable from '@/components/dashboard/ProductsTable'

export default function ProductsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <ProductsTable />
    </div>
  )
}
EOF

cat > src/app/dashboard/orders/page.tsx << 'EOF'
import OrdersTable from '@/components/dashboard/OrdersTable'

export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <OrdersTable />
    </div>
  )
}
EOF

# API routes
mkdir -p src/app/api/{auth,businesses,products,orders,catalog}

cat > src/app/api/businesses/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    })
    
    return NextResponse.json(businesses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const business = await prisma.business.create({
      data: {
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }
    })
    
    return NextResponse.json(business)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }
}
EOF

# Catalog route (customer-facing)
cat > src/app/[businessSlug]/page.tsx << 'EOF'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CatalogView from '@/components/catalog/CatalogView'

interface CatalogPageProps {
  params: {
    businessSlug: string
  }
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.businessSlug },
    include: {
      categories: {
        where: { isActive: true },
        include: {
          products: {
            where: { isActive: true },
            include: {
              variants: true,
              modifiers: true
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!business) {
    notFound()
  }

  return <CatalogView business={business} />
}
EOF

# Components directory structure
mkdir -p src/components/{site,dashboard,catalog,ui}

# Site components
cat > src/components/site/Header.tsx << 'EOF'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/site" className="text-2xl font-bold text-blue-600">
            WaveOrder
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link href="/site" className="text-gray-700 hover:text-blue-600">Home</Link>
            <Link href="/site/about" className="text-gray-700 hover:text-blue-600">About</Link>
            <Link href="/site/pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
            <Link href="/site/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
          </nav>
          <div className="flex space-x-4">
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">Login</Link>
            <Link href="/auth/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
EOF

cat > src/components/site/Hero.tsx << 'EOF'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Make Ordering on <span className="text-blue-600">WhatsApp</span> Super Easy
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your customers will love this. No confusion. Create beautiful catalogs and receive orders directly on WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start for Free
            </Link>
            <Link 
              href="/demo" 
              className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              View Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
EOF

# Dashboard components
cat > src/components/dashboard/Sidebar.tsx << 'EOF'
import Link from 'next/link'
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  ClipboardDocumentListIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon 
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Products', href: '/dashboard/products', icon: ShoppingBagIcon },
  { name: 'Orders', href: '/dashboard/orders', icon: ClipboardDocumentListIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UsersIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
]

export default function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-sm">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-blue-600">WaveOrder</h2>
      </div>
      <nav className="mt-6">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
EOF

# Create root layout redirect
cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WaveOrder - WhatsApp Ordering Made Easy',
  description: 'Create beautiful catalogs and receive orders directly on WhatsApp',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
EOF

cat > src/app/page.tsx << 'EOF'
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/site')
}
EOF

# Create placeholder components
cat > src/components/site/Features.tsx << 'EOF'
export default function Features() {
  const features = [
    {
      title: "WhatsApp Native",
      description: "Leverages the platform customers already use - no new apps required"
    },
    {
      title: "Beautiful Catalogs",
      description: "Create stunning product catalogs with your branding"
    },
    {
      title: "Multi-User Accounts",
      description: "Team collaboration with multiple users per business"
    },
    {
      title: "Flexible Setup",
      description: "Manual, CSV import, or API integration options"
    },
    {
      title: "Order Management",
      description: "Track orders, manage inventory, and analytics"
    },
    {
      title: "Payment Flexibility",
      description: "Support for local payment methods and gateways"
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose WaveOrder?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
EOF

cat > src/components/site/Footer.tsx << 'EOF'
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">WaveOrder</h3>
            <p className="text-gray-400">Making WhatsApp ordering super easy for restaurants and businesses.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Features</li>
              <li>Pricing</li>
              <li>Documentation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li>About</li>
              <li>Contact</li>
              <li>Blog</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Help Center</li>
              <li>FAQ</li>
              <li>Status</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
EOF

# Create remaining placeholder components
mkdir -p src/components/{site,dashboard,catalog}

echo "export default function Testimonials() { return <div>Testimonials Component</div> }" > src/components/site/Testimonials.tsx
echo "export default function CTA() { return <div>CTA Component</div> }" > src/components/site/CTA.tsx
echo "export default function DashboardHeader() { return <div>Dashboard Header</div> }" > src/components/dashboard/Header.tsx
echo "export default function DashboardOverview() { return <div>Dashboard Overview</div> }" > src/components/dashboard/DashboardOverview.tsx
echo "export default function ProductsTable() { return <div>Products Table</div> }" > src/components/dashboard/ProductsTable.tsx
echo "export default function OrdersTable() { return <div>Orders Table</div> }" > src/components/dashboard/OrdersTable.tsx
echo "export default function CatalogView({ business }: { business: any }) { return <div>Catalog View for {business.name}</div> }" > src/components/catalog/CatalogView.tsx

# Install prisma and generate client
echo "🔧 Setting up database..."
npx prisma generate

# Create package.json scripts
npm pkg set scripts.dev="next dev"
npm pkg set scripts.build="next build"
npm pkg set scripts.start="next start"
npm pkg set scripts.lint="next lint"
npm pkg set scripts.db:push="prisma db push"
npm pkg set scripts.db:studio="prisma studio"
npm pkg set scripts.db:generate="prisma generate"
npm pkg set scripts.db:seed="tsx prisma/seed.ts"

# Create seed file
cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample business
  const business = await prisma.business.create({
    data: {
      name: "Pizza Palace",
      slug: "pizza-palace",
      description: "Authentic Italian pizza and pasta",
      whatsappNumber: "+1234567890",
      businessType: "RESTAURANT",
      currency: "USD",
      primaryColor: "#dc2626",
      secondaryColor: "#7f1d1d",
    }
  })

  // Create categories
  const pizzaCategory = await prisma.category.create({
    data: {
      name: "Pizza",
      businessId: business.id,
      sortOrder: 1
    }
  })

  const drinkCategory = await prisma.category.create({
    data: {
      name: "Drinks",
      businessId: business.id,
      sortOrder: 2
    }
  })

  // Create products
  await prisma.product.create({
    data: {
      name: "Margherita Pizza",
      description: "Fresh mozzarella, tomato sauce, basil",
      price: 14.99,
      categoryId: pizzaCategory.id,
      businessId: business.id,
      variants: {
        create: [
          { name: "Small", price: 12.99 },
          { name: "Medium", price: 14.99 },
          { name: "Large", price: 18.99 }
        ]
      },
      modifiers: {
        create: [
          { name: "Extra Cheese", price: 2.50 },
          { name: "Mushrooms", price: 1.50 },
          { name: "Pepperoni", price: 2.00 }
        ]
      }
    }
  })

  await prisma.product.create({
    data: {
      name: "Coca Cola",
      description: "Refreshing cola drink",
      price: 2.99,
      categoryId: drinkCategory.id,
      businessId: business.id,
      variants: {
        create: [
          { name: "Can 330ml", price: 2.99 },
          { name: "Bottle 500ml", price: 3.99 }
        ]
      }
    }
  })

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
EOF

# Install tsx for running TypeScript files
npm install --save-dev tsx

# Create additional site pages
cat > src/app/site/about/page.tsx << 'EOF'
export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-8">About WaveOrder</h1>
      <div className="prose prose-lg">
        <p>
          WaveOrder is a comprehensive WhatsApp ordering platform designed specifically 
          for restaurants, cafes, and retail businesses. Our mission is to make online 
          ordering as simple as sending a WhatsApp message.
        </p>
        <h2>Our Story</h2>
        <p>
          Born from the need to simplify online ordering, WaveOrder bridges the gap 
          between businesses and customers through the world's most popular messaging platform.
        </p>
        <h2>Why WhatsApp?</h2>
        <p>
          With over 2 billion users worldwide, WhatsApp is already on every customer's phone. 
          No new apps to download, no complicated signup processes - just simple, familiar ordering.
        </p>
      </div>
    </div>
  )
}
EOF

cat > src/app/site/pricing/page.tsx << 'EOF'
export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "5 products",
        "1 category", 
        "Basic catalog",
        "WhatsApp orders",
        "Email support"
      ]
    },
    {
      name: "Basic",
      price: "$9",
      period: "per month",
      features: [
        "Unlimited products",
        "Unlimited categories",
        "Custom branding",
        "Order management",
        "Analytics",
        "Priority support"
      ]
    },
    {
      name: "Premium",
      price: "$29",
      period: "per month",
      features: [
        "Everything in Basic",
        "Multiple users",
        "API access",
        "Custom domain",
        "Advanced analytics",
        "Wholesale pricing"
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600">Choose the plan that fits your business needs</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <div key={index} className="border rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-gray-600">/{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-gray-700">{feature}</li>
              ))}
            </ul>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
EOF

cat > src/app/site/contact/page.tsx << 'EOF'
export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Contact Us</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input 
              type="email" 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type
            </label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Restaurant</option>
              <option>Cafe</option>
              <option>Retail</option>
              <option>Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea 
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
}
EOF

cat > src/app/site/faq/page.tsx << 'EOF'
export default function FAQPage() {
  const faqs = [
    {
      question: "How does WhatsApp ordering work?",
      answer: "Customers browse your catalog on our platform, select items, and click 'Order via WhatsApp'. This opens WhatsApp with a pre-formatted message containing their order details."
    },
    {
      question: "Do I need WhatsApp Business API?",
      answer: "No! Our platform works with your regular WhatsApp or WhatsApp Business number. No expensive API required."
    },
    {
      question: "Can I customize my catalog?",
      answer: "Yes! You can customize colors, upload your logo, and brand your catalog to match your business identity."
    },
    {
      question: "What payment methods are supported?",
      answer: "We support cash on delivery, bank transfers, and various local payment methods depending on your region."
    },
    {
      question: "Can multiple team members access the dashboard?",
      answer: "Yes! Our premium plans support multiple users per business account with different permission levels."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h1>
      
      <div className="space-y-8">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b pb-6">
            <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
            <p className="text-gray-700">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
EOF

# Create auth pages
mkdir -p src/app/{login,register}

cat > src/app/login/page.tsx << 'EOF'
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900"
              placeholder="Password"
            />
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
EOF

cat > src/app/register/page.tsx << 'EOF'
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900"
                placeholder="Full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="business-name" className="sr-only">Business name</label>
              <input
                id="business-name"
                name="business-name"
                type="text"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900"
                placeholder="Business name"
              />
            </div>
            <div>
              <label htmlFor="whatsapp" className="sr-only">WhatsApp number</label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900"
                placeholder="WhatsApp number"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900"
                placeholder="Password"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
EOF

# Create middleware for route protection
cat > src/middleware.ts << 'EOF'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Add authentication logic here
    // For now, just allow all requests
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
EOF

# Create types
mkdir -p src/types
cat > src/types/index.ts << 'EOF'
export interface Business {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  whatsappNumber: string
  businessType: string
  primaryColor: string
  secondaryColor: string
  currency: string
}

export interface Product {
  id: string
  name: string
  description?: string
  images: string[]
  price: number
  originalPrice?: number
  categoryId: string
  variants?: ProductVariant[]
  modifiers?: ProductModifier[]
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
}

export interface ProductModifier {
  id: string
  name: string
  price: number
  required: boolean
}

export interface Category {
  id: string
  name: string
  description?: string
  products: Product[]
}

export interface Order {
  id: string
  orderNumber: string
  status: string
  type: string
  customer: Customer
  items: OrderItem[]
  total: number
  createdAt: Date
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
}

export interface OrderItem {
  id: string
  product: Product
  variant?: ProductVariant
  quantity: number
  price: number
  modifiers: string[]
}
EOF

echo "✅ WaveOrder project setup complete!"
echo ""
echo "Next steps:"
echo "1. cd waveorder"
echo "2. Update .env.local with your actual environment variables"
echo "3. npm run db:push (to create database)"
echo "4. npm run db:seed (to add sample data)"
echo "5. npm run dev (to start development server)"
echo ""
echo "URLs:"
echo "- Site: http://localhost:3000/site"
echo "- Dashboard: http://localhost:3000/dashboard"
echo "- Sample catalog: http://localhost:3000/pizza-palace"
echo ""
echo "Happy coding! 🚀"