# Custom Menu & Filtering Implementation Plan

## OVERVIEW

Two new features for customizing storefront navigation and filtering:
1. **Custom Menu** - Override default category menu with custom items
2. **Custom Filtering** - Choose which filters to show (collections, groups, brands)

---

## PART 1: DATABASE SCHEMA

### Business Model Updates

```prisma
model Business {
  // ... existing fields ...
  
  // Custom Menu
  customMenuEnabled: Boolean @default(false)  // Already exists
  customMenuItems: Json?  // NEW - Array of menu items
  
  // Custom Filtering
  customFilteringEnabled: Boolean @default(false)  // Already exists
  customFilterSettings: Json?  // NEW - Filter configuration
}
```

### JSON Structures

#### customMenuItems Format:
```typescript
interface CustomMenuItem {
  id: string  // UUID
  type: 'group' | 'collection' | 'category' | 'link'
  name: string  // Display name (English)
  nameAl?: string  // Display name (Albanian)
  targetId?: string  // ObjectId of group/collection/category
  url?: string  // For custom links
  sortOrder: number
  isActive: boolean
}

// Example:
[
  {
    id: "uuid-1",
    type: "collection",
    name: "New Arrivals",
    nameAl: "Të Reja",
    targetId: "collection-id-123",
    sortOrder: 0,
    isActive: true
  },
  {
    id: "uuid-2",
    type: "category",
    name: "Electronics",
    nameAl: "Elektronikë",
    targetId: "category-id-456",
    sortOrder: 1,
    isActive: true
  },
  {
    id: "uuid-3",
    type: "link",
    name: "Contact Us",
    nameAl: "Na Kontaktoni",
    url: "https://example.com/contact",
    sortOrder: 2,
    isActive: true
  }
]
```

#### customFilterSettings Format:
```typescript
interface CustomFilterSettings {
  categoriesEnabled: boolean  // Always true
  collectionsEnabled: boolean
  groupsEnabled: boolean
  brandsEnabled: boolean
  priceRangeEnabled: boolean  // Always true
}

// Example:
{
  "categoriesEnabled": true,
  "collectionsEnabled": true,
  "groupsEnabled": false,
  "brandsEnabled": true,
  "priceRangeEnabled": true
}
```

---

## PART 2: ADMIN API ROUTES

### A. Custom Menu API

#### GET `/api/admin/stores/[businessId]/custom-menu`
**Response:**
```json
{
  "menuItems": [
    {
      "id": "uuid-1",
      "type": "collection",
      "name": "New Arrivals",
      "nameAl": "Të Reja",
      "targetId": "collection-id",
      "sortOrder": 0,
      "isActive": true,
      "target": {  // Populated entity details
        "id": "collection-id",
        "name": "New Arrivals",
        "nameAl": "Të Reja"
      }
    }
  ],
  "availableGroups": [...],
  "availableCollections": [...],
  "availableCategories": [...]
}
```

#### POST `/api/admin/stores/[businessId]/custom-menu`
**Body:**
```json
{
  "type": "collection",
  "targetId": "collection-id-123"
}
```
**Logic:**
- Fetch target entity (group/collection/category)
- Auto-populate name and nameAl from target
- Generate UUID
- Add to customMenuItems array
- Sort by sortOrder

#### PUT `/api/admin/stores/[businessId]/custom-menu/[itemId]`
**Body:**
```json
{
  "name": "Updated Name",
  "nameAl": "Emri i Përditësuar",
  "url": "https://newurl.com",
  "isActive": false,
  "sortOrder": 5
}
```

#### DELETE `/api/admin/stores/[businessId]/custom-menu/[itemId]`

#### PATCH `/api/admin/stores/[businessId]/custom-menu/reorder`
**Body:**
```json
{
  "itemIds": ["uuid-2", "uuid-1", "uuid-3"]
}
```
**Logic:** Update sortOrder based on array position

---

### B. Custom Filtering API

#### GET `/api/admin/stores/[businessId]/custom-filtering`
**Response:**
```json
{
  "settings": {
    "categoriesEnabled": true,
    "collectionsEnabled": true,
    "groupsEnabled": false,
    "brandsEnabled": true,
    "priceRangeEnabled": true
  }
}
```

#### PATCH `/api/admin/stores/[businessId]/custom-filtering`
**Body:**
```json
{
  "collectionsEnabled": true,
  "groupsEnabled": false,
  "brandsEnabled": true
}
```
**Note:** categoriesEnabled and priceRangeEnabled cannot be changed (always true)

---

## PART 3: ADMIN UI PAGES

### A. Custom Menu Page
**Location:** `/admin/stores/[businessId]/custom-menu/page.tsx`

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│ Custom Menu                      [+ Add Item]│
├─────────────────────────────────────────────┤
│ ⚠ Feature not enabled                       │
│   Contact SuperAdmin to enable this feature │ (if disabled)
├─────────────────────────────────────────────┤
│ Drag to reorder menu items                  │
│                                              │
│ [≡] New Arrivals (Collection)    [Edit] [×] │
│ [≡] Electronics (Category)        [Edit] [×] │
│      • Shows subcategories when clicked      │
│ [≡] Featured Products (Group)    [Edit] [×] │
│ [≡] Contact Us (Custom Link)     [Edit] [×] │
└─────────────────────────────────────────────┘
```

**Modal: Add/Edit Menu Item**
```
┌─────────────────────────────────┐
│ Add Menu Item            [×]    │
├─────────────────────────────────┤
│ Type *                          │
│ [▼ Select Type            ]     │
│   - Group                       │
│   - Collection                  │
│   - Category                    │
│   - Custom Link                 │
│                                 │
│ [If Type = Group]               │
│ Select Group *                  │
│ [▼ Featured Products      ]     │
│                                 │
│ [If Type = Custom Link]         │
│ Display Name (English) *        │
│ [___________________________]   │
│                                 │
│ Display Name (Albanian)         │
│ [___________________________]   │
│                                 │
│ URL *                           │
│ [___________________________]   │
│                                 │
│ Active                          │
│ [☑] Show in menu                │
│                                 │
│         [Cancel]  [Save]        │
└─────────────────────────────────┘
```

**Features:**
- Drag-and-drop reordering
- Edit inline or modal
- Delete confirmation
- Auto-populate names from target entity
- Show entity type badge

---

### B. Custom Filtering Page
**Location:** `/admin/stores/[businessId]/custom-filtering/page.tsx`

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│ Custom Filtering                             │
├─────────────────────────────────────────────┤
│ ⚠ Feature not enabled                       │
│   Contact SuperAdmin to enable this feature │ (if disabled)
├─────────────────────────────────────────────┤
│ Choose which filters to show on storefront: │
│                                              │
│ ☑ Categories (Always enabled)               │
│ ☐ Collections                                │
│ ☐ Groups                                     │
│ ☐ Brands                                     │
│ ☑ Price Range (Always enabled)              │
│                                              │
│                            [Save Changes]    │
└─────────────────────────────────────────────┘
```

**Features:**
- Simple checkboxes
- Categories and Price Range disabled (checked, greyed out)
- Save button
- Success/error messages

---

## PART 4: STOREFRONT IMPLEMENTATION

### A. Connected Businesses Query Optimization

**File:** `/api/storefront/[slug]/route.ts`

**Current Logic (Line 149-197):**
```typescript
const business = await prisma.business.findUnique({
  where: { slug, isActive: true, setupWizardCompleted: true },
  include: {
    categories: {
      where: { isActive: true },
      include: {
        products: { where: { isActive: true } }
      }
    }
  }
})
```

**NEW OPTIMIZED LOGIC:**
```typescript
// Step 1: Fetch business with connections
const business = await prisma.business.findUnique({
  where: { slug, isActive: true, setupWizardCompleted: true },
  select: {
    id: true,
    connectedBusinesses: true,
    customMenuEnabled: true,
    customMenuItems: true,
    customFilteringEnabled: true,
    customFilterSettings: true,
    // ... all other business fields
  }
})

// Step 2: Check if has connections (optimization)
const hasConnections = business.connectedBusinesses && business.connectedBusinesses.length > 0

// Step 3: Build businessIds array for queries
const businessIds = hasConnections 
  ? [business.id, ...business.connectedBusinesses]
  : [business.id]

// Step 4: Fetch categories
const categories = await prisma.category.findMany({
  where: {
    businessId: { in: businessIds },
    isActive: true
  },
  include: {
    parent: true,
    children: { where: { isActive: true } },
    products: {
      where: {
        businessId: { in: businessIds },
        isActive: true,
        price: { gt: 0 }  // Don't show zero-price products
      },
      include: { variants: true, modifiers: true }
    }
  },
  orderBy: { sortOrder: 'asc' }
})

// Step 5: Fetch additional entities for custom menu/filtering
let collections = []
let groups = []
let brands = []

if (business.customMenuEnabled || business.customFilteringEnabled) {
  // Fetch collections
  if (business.customMenuEnabled || business.customFilterSettings?.collectionsEnabled) {
    collections = await prisma.collection.findMany({
      where: {
        businessId: { in: businessIds },
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    })
  }
  
  // Fetch groups
  if (business.customMenuEnabled || business.customFilterSettings?.groupsEnabled) {
    groups = await prisma.group.findMany({
      where: {
        businessId: { in: businessIds },
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    })
  }
  
  // Fetch brands
  if (business.customFilterSettings?.brandsEnabled) {
    brands = await prisma.brand.findMany({
      where: {
        businessId: { in: businessIds },
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    })
  }
}

// Step 6: Attach to business object
business.categories = categories
business.collections = collections
business.groups = groups
business.brands = brands
```

---

### B. Custom Menu Display Logic

**File:** `StoreFront.tsx`

**Logic:**
```typescript
// Determine which menu to show
const showCustomMenu = business.customMenuEnabled && 
                       business.customMenuItems && 
                       business.customMenuItems.length > 0

const menuItems = showCustomMenu 
  ? buildCustomMenu(business.customMenuItems, business, storefrontLanguage)
  : buildDefaultMenu(business.categories, storefrontLanguage)

function buildCustomMenu(items, business, language) {
  return items
    .filter(item => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => {
      const displayName = language === 'sq' && item.nameAl 
        ? item.nameAl 
        : item.name
      
      switch (item.type) {
        case 'group':
          const group = business.groups.find(g => g.id === item.targetId)
          return {
            type: 'group',
            id: item.id,
            name: displayName,
            targetId: item.targetId,
            group: group
          }
        
        case 'collection':
          const collection = business.collections.find(c => c.id === item.targetId)
          return {
            type: 'collection',
            id: item.id,
            name: displayName,
            targetId: item.targetId,
            collection: collection
          }
        
        case 'category':
          const category = business.categories.find(c => c.id === item.targetId)
          return {
            type: 'category',
            id: item.id,
            name: displayName,
            targetId: item.targetId,
            category: category,
            subcategories: category?.children?.filter(c => c.isActive) || []
          }
        
        case 'link':
          return {
            type: 'link',
            id: item.id,
            name: displayName,
            url: item.url
          }
      }
    })
}
```

**Rendering:**
```tsx
{menuItems.map(item => {
  if (item.type === 'link') {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        {item.name}
      </a>
    )
  }
  
  if (item.type === 'category' && item.subcategories.length > 0) {
    return (
      <div>
        <button onClick={() => toggleCategory(item.id)}>
          {item.name}
          {expandedCategories.has(item.id) ? <ChevronUp /> : <ChevronDown />}
        </button>
        {expandedCategories.has(item.id) && (
          <div>
            {item.subcategories.map(sub => (
              <button onClick={() => filterByCategory(sub.id)}>
                {language === 'sq' && sub.nameAl ? sub.nameAl : sub.name}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <button onClick={() => filterByMenuItem(item)}>
      {item.name}
    </button>
  )
})}
```

---

### C. Custom Filtering Display Logic

**File:** `StoreFront.tsx`

**Logic:**
```typescript
const filterSettings = business.customFilteringEnabled && business.customFilterSettings
  ? business.customFilterSettings
  : {
      categoriesEnabled: true,
      collectionsEnabled: false,
      groupsEnabled: false,
      brandsEnabled: false,
      priceRangeEnabled: true
    }

function renderFilters() {
  return (
    <div className="filters">
      {/* Categories - Always shown */}
      {filterSettings.categoriesEnabled && (
        <FilterSection title="Categories">
          {categories.map(cat => (
            <Checkbox 
              label={language === 'sq' && cat.nameAl ? cat.nameAl : cat.name}
              onChange={() => toggleCategoryFilter(cat.id)}
            />
          ))}
        </FilterSection>
      )}
      
      {/* Collections - Optional */}
      {filterSettings.collectionsEnabled && collections.length > 0 && (
        <FilterSection title="Collections">
          {collections.map(col => (
            <Checkbox 
              label={language === 'sq' && col.nameAl ? col.nameAl : col.name}
              onChange={() => toggleCollectionFilter(col.id)}
            />
          ))}
        </FilterSection>
      )}
      
      {/* Groups - Optional */}
      {filterSettings.groupsEnabled && groups.length > 0 && (
        <FilterSection title="Groups">
          {groups.map(grp => (
            <Checkbox 
              label={language === 'sq' && grp.nameAl ? grp.nameAl : grp.name}
              onChange={() => toggleGroupFilter(grp.id)}
            />
          ))}
        </FilterSection>
      )}
      
      {/* Brands - Optional */}
      {filterSettings.brandsEnabled && brands.length > 0 && (
        <FilterSection title="Brands">
          {brands.map(brand => (
            <Checkbox 
              label={language === 'sq' && brand.nameAl ? brand.nameAl : brand.name}
              onChange={() => toggleBrandFilter(brand.id)}
            />
          ))}
        </FilterSection>
      )}
      
      {/* Price Range - Always shown */}
      {filterSettings.priceRangeEnabled && (
        <FilterSection title="Price Range">
          <input type="range" min={minPrice} max={maxPrice} />
        </FilterSection>
      )}
    </div>
  )
}
```

**Filtering Logic:**
```typescript
function filterProducts() {
  let filtered = allProducts
  
  // Filter by categories
  if (selectedCategories.size > 0) {
    filtered = filtered.filter(p => selectedCategories.has(p.categoryId))
  }
  
  // Filter by collections
  if (selectedCollections.size > 0) {
    filtered = filtered.filter(p => 
      p.collectionIds?.some(id => selectedCollections.has(id))
    )
  }
  
  // Filter by groups
  if (selectedGroups.size > 0) {
    filtered = filtered.filter(p => 
      p.groupIds?.some(id => selectedGroups.has(id))
    )
  }
  
  // Filter by brands
  if (selectedBrands.size > 0) {
    filtered = filtered.filter(p => selectedBrands.has(p.brandId))
  }
  
  // Filter by price range
  filtered = filtered.filter(p => 
    p.price >= priceRange.min && p.price <= priceRange.max
  )
  
  return filtered
}
```

---

## PART 5: ADMIN SIDEBAR NAVIGATION

**File:** `AdminSidebar.tsx`

**Add to navigation array:**
```typescript
{
  name: 'Custom Menu',
  href: `/admin/stores/${businessId}/custom-menu`,
  icon: Menu,
  show: customMenuEnabled  // Conditionally shown
},
{
  name: 'Custom Filtering',
  href: `/admin/stores/${businessId}/custom-filtering`,
  icon: SlidersHorizontal,
  show: customFilteringEnabled  // Conditionally shown
}
```

---

## PART 6: IMPLEMENTATION ORDER

1. ✅ **Storefront Connected Businesses Query** (PRIORITY)
   - Optimize API route
   - Test performance
   - Ensure no visual badges

2. **Custom Menu - Backend**
   - API routes (GET, POST, PUT, DELETE, PATCH reorder)
   - Feature access checks

3. **Custom Menu - Frontend**
   - Admin UI page
   - Drag-and-drop functionality
   - Modal forms

4. **Custom Filtering - Backend**
   - API routes (GET, PATCH)
   - Feature access checks

5. **Custom Filtering - Frontend**
   - Admin UI page
   - Checkbox toggles

6. **Storefront - Custom Menu Display**
   - Fetch custom menu items
   - Render menu logic
   - Handle category subcategories
   - Handle custom links

7. **Storefront - Custom Filtering**
   - Fetch filter settings
   - Render filters conditionally
   - Apply filters to products

8. **Testing & Polish**
   - Test all combinations
   - Mobile responsiveness
   - Language switching
   - Performance optimization

---

## SUMMARY

**Storage:** JSON in Business model  
**Names:** Auto-populated from entities, respect language  
**Subcategories:** Only active  
**Filters:** Same UI as current  
**Connected Products:** No visual distinction on storefront  
**hideParentInStorefront:** Ignored in custom menu (custom overrides default)  

**Key Principle:** Custom menu and filtering give full control to override default behavior while maintaining performance through smart querying.
