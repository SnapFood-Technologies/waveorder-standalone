# Analytics Dashboard - Current State

> **Status**: Good and Improved  
> **Last Updated**: January 2026  
> **Reviewer**: Griseld (4)

## Summary

WaveOrder has a comprehensive analytics system with multiple dashboards, charts, and metrics. The system uses **Recharts** for interactive charts and custom CSS-based visualizations for simpler displays.

---

## What We Have

### Chart Library
- **Recharts (v3.2.1)** - Used for line and bar charts (PRO feature)
- **Custom CSS Charts** - Bar charts, progress bars for simpler visualizations

### Admin Dashboard Pages

| Page | Path | Access |
|------|------|--------|
| Main Dashboard | `/admin/stores/[businessId]/dashboard` | All plans |
| Analytics | `/admin/stores/[businessId]/analytics` | PRO only |
| Advanced Analytics | `/admin/stores/[businessId]/advanced-analytics` | PRO only |
| Product Shares | `/admin/stores/[businessId]/product-shares` | PRO only |

### API Routes

**Store Analytics** (`/api/admin/stores/[businessId]/analytics/`)
- `/analytics/advanced` - Advanced analytics (overview, traffic, products, time, customers)
- `/analytics/geographic` - Geographic data (countries, cities)
- `/analytics/page-views` - Time-series page views
- `/analytics/product-shares` - Product share tracking
- `/metrics` - Dashboard metrics (views, orders, revenue, growth)
- `/inventory/dashboard` - Inventory analytics

**Superadmin Analytics** (`/api/superadmin/`)
- `/analytics` - Platform-wide analytics
- `/analytics/geolocation` - Geolocation analytics
- `/stats` - Platform statistics

---

## Metrics Tracked

### Overview Metrics
| Metric | Description | Status |
|--------|-------------|--------|
| Total Views | Combined Analytics + VisitorSession | ✅ Working |
| Unique Visitors | Distinct visitor count | ✅ Working |
| Total Orders | Completed orders only | ✅ Working |
| Revenue | From completed orders with PAID status | ✅ Working |
| Conversion Rate | Orders / Views | ✅ Working |
| Average Order Value | Revenue / Orders | ✅ Working |
| Bounce Rate | Single-visit visitors / total visitors | ✅ **Fixed** |
| Avg Session Duration | Placeholder (180s) - requires exit time tracking | ⚠️ Placeholder |
| Growth Percentages | Views, revenue vs previous period | ✅ Working |

### Order Metrics
- Orders by status (PENDING, CONFIRMED, PREPARING, READY, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REFUNDED)
- Order completion by type (Delivery, Pickup, Dine-in)

### Product Metrics
- Top Products by revenue
- Product orders count
- Product quantity sold
- Product revenue

### Customer Metrics
- Total Customers
- Repeat Customers
- Repeat Rate

### Traffic Metrics
- Traffic Sources (source, visitors, orders, conversion rate)
- Campaigns
- Mediums
- Placements

### Geographic Metrics
- Top Countries (visitors, orders, revenue, percentage)
- Top Cities (visitors, orders, revenue, percentage)

### Time-Based Metrics
- Hourly Activity (24-hour breakdown)
- Daily Activity (day of week)
- Peak Hours
- Traffic Trends (daily breakdown)

### Product Sharing Metrics
- Total Share Link Visits
- Top Shared Products

---

## Charts & Visualizations

### Recharts (PRO Feature)
- **Line Chart** - Page views over time
- **Bar Chart** - Page views over time (alternative view)
- **Pie Chart** - Order status distribution (donut chart with labels) ✅ **New**

### Custom CSS Charts
- Bar charts for orders by status
- Bar charts for traffic trends (visitors/orders over time)
- Bar charts for hourly/daily activity
- Progress bars for geographic data
- Progress bars for traffic sources

---

## Time Filters Available

### Date Range Filter
- Today
- Yesterday
- Last 7 days
- Last 30 days
- This month
- Last month
- This year
- Custom range

### Page Views Chart Periods
- Last 7 Days
- Last 30 Days
- Last 3 Months
- Last 6 Months
- This Year
- Last Year

---

## Components

**Main Analytics Components** (`src/components/admin/analytics/`)
- `Analytics.tsx` - Main analytics dashboard with tabs (Overview, Trends, Products, Time Analysis, Customers)
- `AdvancedAnalytics.tsx` - Geographic insights and traffic sources
- `GeographicAnalytics.tsx` - Geographic data visualization
- `ProductSharesAnalytics.tsx` - Product share tracking

**Dashboard Components** (`src/components/admin/dashboard/`)
- `Dashboard.tsx` - Main dashboard container
- `DashboardMetrics.tsx` - Key metrics cards and order status chart
- `BusinessStorefrontViewsChart.tsx` - Page views chart (Recharts)
- `DateRangeFilter.tsx` - Date range selector

---

## Features Summary

### Available Features
- ✅ Date range filtering with custom ranges
- ✅ Period comparison (current vs previous period)
- ✅ Growth percentage calculations
- ✅ CSV export (in Analytics component)
- ✅ Real-time refresh
- ✅ Subscription-based access (PRO plan for advanced features)
- ✅ Responsive design
- ✅ Empty states with helpful messages

### PRO-Only Features
- ✅ Advanced Analytics page
- ✅ Geographic Analytics
- ✅ Product Shares Analytics
- ✅ Storefront Page Views Chart (Recharts)

---

## What's Not Implemented

### Currently Placeholders
1. ~~**Bounce Rate** - Fixed at 35%~~ ✅ **Now calculated from visitor data**
2. **Average Session Duration** - Fixed at 180 seconds (requires exit time tracking in schema)

### Not Built Yet
1. Real-time analytics (WebSocket/SSE updates)
2. Export formats beyond CSV (PDF, Excel)
3. Scheduled email reports
4. Custom dashboard widgets
5. Funnel analysis visualization
6. Cohort analysis
7. A/B testing metrics
8. Mobile app analytics

---

## Potential Future Improvements

### Performance
- Add caching for analytics queries
- Optimize database queries with better indexing
- Implement pagination for large datasets

### Visualization
- More chart types (pie, area, scatter)
- Interactive drill-downs
- Comparison charts (year-over-year)
- Heatmaps for time-based data

### Analytics Depth
- Customer lifetime value (CLV)
- Customer acquisition cost (CAC)
- Return customer rate trends
- Product performance over time
- Seasonal trends analysis

### User Experience
- Save favorite date ranges
- Dashboard customization/widgets
- Alert thresholds (e.g., revenue drops)
- Annotations on charts

### Integration
- Google Analytics integration
- Facebook Pixel integration
- Export to external analytics tools

---

## Architecture Notes

- **Dual data system**: Combines legacy `Analytics` table with new `VisitorSession` table
- **Revenue calculation**: Only counts completed orders (DELIVERED/PICKED_UP + PAID)
- **Access control**: Subscription-based (PRO plan) for advanced features
- **Component structure**: Modular components for reusability
- **API structure**: RESTful endpoints with date range query parameters

---

## Conclusion

**Rating: 4/5** - The analytics system covers core metrics and visualizations comprehensively. Charts work well with Recharts, time filters are flexible, and the data tracked covers the essential business needs. Room for improvement in:
- Fixing placeholder metrics (bounce rate, session duration)
- Adding more chart types
- Real-time updates
- Deeper customer analytics
