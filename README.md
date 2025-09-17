# WaveOrder

WhatsApp ordering platform for restaurants and businesses. Create beautiful catalogs, receive orders via WhatsApp, and manage everything through a comprehensive dashboard.

## Features

- **Multi-tenant SaaS Architecture** - Each business gets their own account with team collaboration
- **WhatsApp Integration** - Orders flow directly to business WhatsApp without expensive API
- **Beautiful Catalogs** - Mobile-optimized product catalogs with brand customization
- **Flexible Setup** - Manual entry, CSV import, or API integration
- **Order Management** - Track orders, manage inventory, customer relationships
- **Payment Flexibility** - Cash on delivery, local payment methods, gateway integration
- **Team Collaboration** - Multiple users per business with role management

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Prisma ORM, MongoDB
- **Authentication:** NextAuth.js
- **Email:** Resend
- **Payments:** Stripe, PayPal, BKT (regionally available)

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd waveorder-standalone
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your database URL and API keys.

4. Set up the database:
```bash
npm run db:push
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000/site` to see the landing page.

## Project Structure

```
src/
├── app/
│   ├── site/              # Public website (home, about, pricing)
│   ├── dashboard/         # Business dashboard
│   ├── [businessSlug]/    # Customer-facing catalogs
│   └── api/              # API routes
├── components/
│   ├── site/             # Landing page components
│   ├── dashboard/        # Dashboard components
│   └── catalog/          # Customer catalog components
├── lib/
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Utility functions
└── types/                # TypeScript definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with sample data

## URLs

- **Landing Page:** `http://localhost:3000/site`
- **Dashboard:** `http://localhost:3000/dashboard`
- **Sample Catalog:** `http://localhost:3000/pizza-palace`

## Domain Setup

WaveOrder supports custom domains for businesses:

- **Owned Domains:** waveorder.xyz, waveorder.store, waveorder.shop
- **Available:** waveorder.co, waveorder.store, waveorder.ai
- **Primary Options:** waveorder.store (recommended)

## Brand Colors

- **Primary:** Wave Teal (#0d9488)
- **Secondary:** Forest Green (#166534)
- **Accent:** Seafoam Green (#10b981)
- **Supporting:** Dark Gray (#374151), Black (#000000), Light Gray (#9ca3af)

## Target Market

**Primary:** Restaurants and cafes
**Secondary:** Retail stores, jewelry, florists, and other product-based businesses

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For development support, contact: development@venueboost.io