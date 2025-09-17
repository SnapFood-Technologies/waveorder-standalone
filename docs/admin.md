# WaveOrder Admin Panel Development Tasks

## 1. Admin Layout & Navigation

### 1.1 Admin Sidebar Component
**File:** `components/admin/Sidebar.tsx`
**Features:**
- Dashboard
- Orders  
- Products
- Customers
- Appearance
- Marketing
- Settings

**Pro Plan Additional Items:**
- Inventory
- Discounts 
- Analytics

### 1.2 Admin Layout
**File:** `app/admin/stores/[businessId]/layout.tsx`
**Features:**
- Responsive sidebar
- Mobile hamburger menu
- Plan-based navigation (hide pro features for basic users)
- User profile dropdown
- Notifications area

## 2. Dashboard

### 2.1 Dashboard Overview Page
**File:** `app/admin/stores/[businessId]/dashboard/page.tsx`

**Metrics Section:**
- Views count with date range
- Orders count
- Sales revenue
- Date range selector (premium only for custom ranges)
- Default range: "September 1, 2025 – September 17, 2025"

**Recent Orders Widget:**
- "Last 30 days" filter
- "No orders" empty state
- Quick order status overview

**Quick Actions:**
- "Test your store experience" button
- Links to store preview
- "Learn more" educational content

**Upgrade Prompts:**
- "Subscribe at $1" banner
- Plan feature comparisons
- Social media follow buttons

### 2.2 Dashboard API
**File:** `app/api/admin/stores/[businessId]/dashboard/route.ts`
**Endpoints:**
- GET dashboard metrics
- GET recent orders summary
- GET analytics data based on plan

## 3. Orders Management

### 3.1 Orders List Page
**File:** `app/admin/stores/[businessId]/orders/page.tsx`
**Features:**
- Orders table with filtering
- Status badges (pending, confirmed, preparing, etc.)
- Search by customer name/order number
- Date range filtering
- Pagination
- Export orders button

### 3.2 Calendar View
**File:** `app/admin/stores/[businessId]/orders/calendar/page.tsx`
**Features:**
- Monthly/weekly calendar view
- Orders displayed as calendar events
- Click to view order details
- Status color coding

### 3.3 Admin Order Creation
**File:** `app/admin/stores/[businessId]/orders/create/page.tsx` (metroshopweb/form?mode=admin)
**Form Fields:**
- Customer name (required)
- WhatsApp number (required) 
- Product selection with quantities
- Remark field (visible to customers)
- Adjustment field (arbitrary amount)
- Promo code input
- Order type (delivery/pickup/dine-in)

### 3.4 Order Details Page
**File:** `app/admin/stores/[businessId]/orders/[orderId]/page.tsx`
**Features:**
- Complete order information
- Customer details
- Items list with pricing
- Order timeline/status history
- Status update buttons
- Print/export order
- Customer communication log

### 3.5 Orders API
**File:** `app/api/admin/stores/[businessId]/orders/route.ts`
**Endpoints:**
- GET orders list with filters
- POST create new order
- PUT update order status
- DELETE cancel order

## 4. Products Management

### 4.1 Products List Page
**File:** `app/admin/stores/[businessId]/products/page.tsx`
**Features:**
- Products table with images
- Category filtering
- Search functionality
- Stock level indicators
- Bulk actions (activate/deactivate)
- Import/export buttons

### 4.2 Add/Edit Product Page
**File:** `app/admin/stores/[businessId]/products/[productId]/page.tsx`
**Form Sections:**
- Basic info (name, description, price)
- Image uploads (multiple images)
- Category selection
- Stock quantity
- Product variants
- Product modifiers
- SEO fields (meta title, description)
- Advanced settings (SKU, featured product)

### 4.3 Categories Management
**File:** `app/admin/stores/[businessId]/categories/page.tsx`
**Features:**
- Categories list
- Add/edit category modal
- Drag-and-drop reordering
- Category image uploads
- Products count per category

### 4.4 Bulk Import/Export
**File:** `app/admin/stores/[businessId]/products/import/page.tsx`
**Features:**
- CSV template download
- Bulk product upload
- Import validation and error handling
- Export current products to CSV

### 4.5 Products API
**File:** `app/api/admin/stores/[businessId]/products/route.ts`
**Endpoints:**
- GET products with pagination and filters
- POST create product
- PUT update product
- DELETE remove product
- POST bulk import
- GET export data

## 5. Customers Management

### 5.1 Customers List Page
**File:** `app/admin/stores/[businessId]/customers/page.tsx`
**Features:**
- Customers table with contact info
- Search by name/phone/email
- Customer tier badges (regular/VIP/wholesale)
- Total customers count
- "No customers found" empty state
- Import/export buttons

### 5.2 Add/Edit Customer Page
**File:** `app/admin/stores/[businessId]/customers/[customerId]/page.tsx`
**Form Fields:**
- Name, phone, email, address
- Customer tier selection
- Notes/remarks
- Order history display

### 5.3 Customer Details & History
**Features:**
- Complete customer profile
- Order history with totals
- Customer communication log
- Edit customer information

### 5.4 Customers API
**File:** `app/api/admin/stores/[businessId]/customers/route.ts`
**Endpoints:**
- GET customers with search/filter
- POST create customer
- PUT update customer
- DELETE remove customer
- POST bulk import customers

## 6. Appearance (Store Customization)

### 6.1 Store Appearance Page
**File:** `app/admin/stores/[businessId]/appearance/page.tsx`

**Profile Section:**
- Business name field
- Description with markdown support (bold, strike, italic)
- Logo upload
- Cover image upload

**Colors Section:**
- Primary color picker
- Secondary color picker
- Background color options

**Banner Section:**
- Banner text (20/45 character limit)
- Banner link (optional)

**Advanced Options:**
- Show reviews toggle
- Show WaveOrder branding toggle
- Custom CSS (pro plan)

**Actions:**
- Save changes button
- Preview store button
- Refresh preview

### 6.2 Store Preview
**File:** `app/admin/stores/[businessId]/appearance/preview/page.tsx`
**Features:**
- Live preview of storefront
- Mobile/desktop view toggle
- Real-time updates from appearance changes

### 6.3 Domain Settings (Pro Plan Only)
**File:** `app/admin/stores/[businessId]/appearance/domain/page.tsx`
**Features:**
- Current store URL display
- Custom domain setup
- Domain verification process
- SSL certificate status

### 6.4 Appearance API
**File:** `app/api/admin/stores/[businessId]/appearance/route.ts`
**Endpoints:**
- GET current appearance settings
- PUT update appearance
- POST upload images
- GET preview data

## 7. Marketing

### 7.1 Marketing Page
**File:** `app/admin/stores/[businessId]/marketing/page.tsx`

**Store Sharing:**
- Store URL with copy button
- QR code generator with download
- Social media share buttons
- Embed code for website

**Promotional Tools:**
- Social media post templates
- Email marketing integration
- WhatsApp broadcast lists

### 7.2 QR Code Generator
**Component:** `components/admin/QRCodeGenerator.tsx`
**Features:**
- Generate QR code for store URL
- Customizable QR code design
- Download in various formats (PNG, SVG)
- Print-ready sizing options

## 8. Settings

### 8.1 Settings Layout
**File:** `app/admin/stores/[businessId]/settings/layout.tsx`
**Tabs:**
- Business Details
- Team Management
- Billing
- SEO Settings
- Store Settings
- Danger Zone

### 8.2 Business Details Tab
**File:** `app/admin/stores/[businessId]/settings/business/page.tsx`
**Fields:**
- Organization ID (read-only)
- Business name
- Business type dropdown
- Number of employees
- Timezone selection
- Contact information
- Address details

### 8.3 Team Management Tab
**File:** `app/admin/stores/[businessId]/settings/team/page.tsx`
**Features:**
- Team members list
- Invite new members
- Role management (owner/manager/staff)
- Pending invitations
- Remove team members

### 8.4 Billing Tab
**File:** `app/admin/stores/[businessId]/settings/billing/page.tsx`
**Features:**
- Current plan display
- Usage statistics
- Billing history
- Payment methods
- Upgrade/downgrade options
- Invoice downloads

### 8.5 SEO Settings Tab
**File:** `app/admin/stores/[businessId]/settings/seo/page.tsx`
**Fields:**
- Meta title
- Meta description
- Keywords
- Search visibility toggle
- Social media preview
- Schema markup options

### 8.6 Store Settings Tab
**File:** `app/admin/stores/[businessId]/settings/store/page.tsx`
**Features:**
- Temporary store closure toggle
- Closure reason dropdown
- Custom closure message
- Scheduled closure dates
- Store visibility settings
- Maintenance mode

### 8.7 Danger Zone Tab
**File:** `app/admin/stores/[businessId]/settings/danger/page.tsx`
**Features:**
- Organization deletion
- Data export before deletion
- "DELETE" confirmation input
- Warning messages about data loss

## 9. Configuration Management

### 9.1 Configuration Sidebar
**File:** `app/admin/stores/[businessId]/configure/page.tsx`
**Sections:**
- Business type selection
- Delivery methods setup
- Payment methods configuration
- WhatsApp message customization
- Order settings

### 9.2 Delivery Methods Configuration
**Features:**
- Enable/disable delivery, pickup, dine-in
- Delivery fee settings
- Delivery radius configuration
- Estimated delivery times
- Service hours

### 9.3 Payment Methods Setup
**Features:**
- Enable/disable payment options
- Cash on delivery/pickup settings
- Online payment integration (future)
- Payment instructions

### 9.4 WhatsApp Message Customization
**File:** `app/admin/stores/[businessId]/configure/whatsapp/page.tsx`
**Features:**
- Order number format selection (WO-123, ORD-456, etc.)
- Message templates
- Greeting message customization
- Auto-reply settings
- Message preview with sample order

### 9.5 Wallet Balance (Future Feature)
**Features:**
- Current balance display
- Transaction history
- Top-up functionality
- Usage tracking

## 10. Pro Plan Features

### 10.1 Inventory Management
**File:** `app/admin/stores/[businessId]/inventory/page.tsx`
**Features:**
- Advanced stock tracking
- Low stock alerts
- Inventory movements log
- Stock adjustments
- Supplier management
- Purchase orders

### 10.2 Discounts Management
**File:** `app/admin/stores/[businessId]/discounts/page.tsx`
**Features:**
- Discount codes creation
- Percentage/fixed amount discounts
- Usage limits and expiry dates
- Customer-specific discounts
- Bulk discount application
- Discount analytics

### 10.3 Advanced Analytics
**File:** `app/admin/stores/[businessId]/analytics/page.tsx`
**Features:**
- Sales reports with charts
- Customer behavior analytics
- Product performance metrics
- Revenue trends
- Custom date ranges
- Export reports
- Goal tracking

## 11. Shared Components

### 11.1 Plan Upgrade Modal
**Component:** `components/admin/UpgradeModal.tsx`
**Features:**
- Feature comparison table
- Pricing display
- Upgrade call-to-action
- Trial period information

### 11.2 Data Table Component
**Component:** `components/admin/DataTable.tsx`
**Features:**
- Sortable columns
- Filtering
- Pagination
- Bulk actions
- Export functionality
- Responsive design

### 11.3 Form Components
**Components:** `components/admin/forms/`
**Includes:**
- Form validation
- Error handling
- Auto-save functionality
- Required field indicators
- Help tooltips

### 11.4 Image Upload Component
**Component:** `components/admin/ImageUpload.tsx`
**Features:**
- Drag and drop upload
- Image preview
- Multiple file selection
- Image optimization
- Progress indicators

## 12. API Routes Summary

### Core APIs:
- `/api/admin/stores/[businessId]/dashboard`
- `/api/admin/stores/[businessId]/orders`
- `/api/admin/stores/[businessId]/products`
- `/api/admin/stores/[businessId]/customers`
- `/api/admin/stores/[businessId]/appearance`
- `/api/admin/stores/[businessId]/settings`

### Configuration APIs:
- `/api/admin/stores/[businessId]/configure`
- `/api/admin/stores/[businessId]/whatsapp`
- `/api/admin/stores/[businessId]/closure`

### Pro Plan APIs:
- `/api/admin/stores/[businessId]/inventory`
- `/api/admin/stores/[businessId]/discounts`
- `/api/admin/stores/[businessId]/analytics`

## Implementation Priority

### Phase 1 (Essential Features):
1. Admin layout and navigation
2. Dashboard with basic metrics
3. Orders management (list, details, creation)
4. Products management (CRUD operations)
5. Basic settings (business details, store closure)

### Phase 2 (Enhanced Features):
1. Customers management
2. Appearance customization
3. Marketing tools
4. Team management
5. Configuration management

### Phase 3 (Pro Features):
1. Advanced analytics
2. Inventory management
3. Discounts system
4. Advanced SEO tools