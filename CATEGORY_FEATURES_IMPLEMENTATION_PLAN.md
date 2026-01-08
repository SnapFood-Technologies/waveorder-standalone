# Category Features Implementation Plan
## Multi-Language Support & Subcategories

---

## 📋 **1. DATABASE CHANGES (Prisma Schema)**

### File: `prisma/schema.prisma`

**Changes needed:**
```prisma
model Category {
  id          String  @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  description String?
  
  // NEW: Multi-language fields
  nameAl        String?  // Albanian name
  descriptionAl String?  // Albanian description
  
  // NEW: Subcategory support
  parentId   String?  @db.ObjectId  // Parent category ID (null = top-level)
  parent     Category? @relation("CategoryChildren", fields: [parentId], references: [id], onDelete: Cascade)
  children   Category[] @relation("CategoryChildren")
  
  image       String?
  sortOrder   Int     @default(0)
  isActive    Boolean @default(true)
  businessId  String  @db.ObjectId

  business Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  products Product[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([parentId])
  @@index([businessId, parentId])  // For efficient parent/child queries
}
```

---

## 🔧 **2. ADMIN SIDE CHANGES**

### **A. API Routes**

#### **2.1 GET Categories List**
**File:** `src/app/api/admin/stores/[businessId]/categories/route.ts`
- ✅ Update query to include `parentId`, `nameAl`, `descriptionAl`
- ✅ Add filtering by parent (to show only top-level or children)
- ✅ Add recursive query option to get full hierarchy
- ✅ Update response to include parent/children relationships

#### **2.2 POST Create Category**
**File:** `src/app/api/admin/stores/[businessId]/categories/route.ts`
- ✅ Accept `parentId`, `nameAl`, `descriptionAl` in request body
- ✅ Validate parent exists and belongs to same business
- ✅ Prevent circular references (category can't be its own parent)
- ✅ Update sortOrder logic to consider parent hierarchy

#### **2.3 PUT/PATCH Update Category**
**File:** `src/app/api/admin/stores/[businessId]/categories/[categoryId]/route.ts`
- ✅ Accept `parentId`, `nameAl`, `descriptionAl` in updates
- ✅ Validate parent changes (prevent circular references)
- ✅ Handle moving category to different parent
- ✅ Update children if parent changes

#### **2.4 DELETE Category**
**File:** `src/app/api/admin/stores/[businessId]/categories/[categoryId]/route.ts`
- ✅ Check if category has children before deletion
- ✅ Option: Delete children recursively OR prevent deletion if has children
- ✅ Update response to indicate if children were deleted

#### **2.5 Reorder Categories**
**File:** `src/app/api/admin/stores/[businessId]/categories/reorder/route.ts`
- ✅ Update to handle reordering within parent context
- ✅ Support reordering subcategories separately from parent categories

---

### **B. Admin Components**

#### **2.6 Categories Management Page**
**File:** `src/components/admin/categories/CategoriesManagement.tsx`
- ✅ Update Category interface to include `parentId`, `nameAl`, `descriptionAl`, `children`
- ✅ Add language toggle/selector (English/Albanian)
- ✅ Display categories in hierarchical tree structure
- ✅ Add "Parent Category" dropdown in form
- ✅ Show parent category in category list
- ✅ Add expand/collapse for subcategories
- ✅ Update drag-and-drop to respect parent-child relationships
- ✅ Add visual indentation for subcategories
- ✅ Update category count to show parent + children

#### **2.7 Category Form Component**
**File:** `src/components/admin/categories/CategoriesManagement.tsx` (CategoryForm)
- ✅ Add fields for:
  - `nameAl` (Albanian name)
  - `descriptionAl` (Albanian description)
  - `parentId` (Parent category dropdown)
- ✅ Add language tabs or toggle
- ✅ Show parent category selector (filter out self and descendants)
- ✅ Display current parent in edit mode
- ✅ Add validation (can't select self as parent)

#### **2.8 Product Form**
**File:** `src/components/admin/products/ProductForm.tsx`
- ✅ Update category dropdown to show hierarchical structure
- ✅ Display parent → child format (e.g., "Main Courses > Appetizers")
- ✅ Filter categories based on parent when needed

#### **2.9 Products Management**
**File:** `src/components/admin/products/ProductsManagement.tsx`
- ✅ Update category filter to show hierarchical structure
- ✅ Group products by parent category in listings

---

## 🛍️ **3. STOREFRONT CHANGES**

### **A. API Routes**

#### **3.1 Storefront API**
**File:** `src/app/api/storefront/[slug]/route.ts`
- ✅ Include `parentId`, `nameAl`, `descriptionAl` in category response
- ✅ Include `children` array in category response
- ✅ Filter categories based on storefront language setting
- ✅ Return categories in hierarchical structure
- ✅ Use `nameAl`/`descriptionAl` if storefront language is Albanian

---

### **B. Storefront Components**

#### **3.2 StoreFront Component**
**File:** `src/components/storefront/StoreFront.tsx`
- ✅ Update Category interface to include `parentId`, `nameAl`, `descriptionAl`, `children`
- ✅ Filter categories by language (use `nameAl` if Albanian)
- ✅ Display categories in hierarchical structure
- ✅ Add expand/collapse for subcategories
- ✅ Update category navigation to show parent → child breadcrumbs
- ✅ Filter products by parent category when subcategory is selected
- ✅ Update category selection logic to handle parent/child relationships

#### **3.3 Category Display Logic**
**File:** `src/components/storefront/StoreFront.tsx`
- ✅ Build category tree structure
- ✅ Show only top-level categories initially
- ✅ Allow expanding to show subcategories
- ✅ Update product filtering to work with subcategories
- ✅ Update search to include subcategory names

---

## 📝 **4. TYPE DEFINITIONS**

### **4.1 TypeScript Interfaces**
**Files to update:**
- `src/types/index.ts` - Category interface
- `src/components/storefront/StoreFront.tsx` - Category interface
- `src/components/admin/categories/CategoriesManagement.tsx` - Category interface
- `src/components/setup/steps/ProductSetupStep.tsx` - Category interface

**Changes:**
```typescript
interface Category {
  id: string
  name: string
  nameAl?: string  // NEW
  description?: string
  descriptionAl?: string  // NEW
  parentId?: string  // NEW
  parent?: Category  // NEW
  children?: Category[]  // NEW
  image?: string
  sortOrder: number
  isActive: boolean
  products?: Product[]
}
```

---

## 🔄 **5. SETUP WIZARD CHANGES**

#### **5.1 Product Setup Step**
**File:** `src/components/setup/steps/ProductSetupStep.tsx`
- ✅ Update category creation to support parent selection
- ✅ Add language fields for category name/description
- ✅ Show hierarchical category structure in dropdown

---

## 📊 **6. ADDITIONAL CONSIDERATIONS**

### **6.1 Data Migration**
- ✅ Migration script to add new fields (nullable, so existing data works)
- ✅ Set default `parentId` to `null` for all existing categories
- ✅ Set default `nameAl` and `descriptionAl` to `null`

### **6.2 Validation Rules**
- ✅ Prevent circular parent references
- ✅ Ensure parent belongs to same business
- ✅ Prevent category from being its own parent
- ✅ Prevent moving category to its own descendant

### **6.3 UI/UX Considerations**

#### **Storefront Design Options for Subcategories (Horizontal Layout)**

The current storefront uses a **flat horizontal scrollable tab bar**. Here are design options that work well with this layout:

**Option 1: Two-Level Horizontal Tabs (Recommended)**
- Show only **top-level categories** in the main horizontal tab bar
- When a parent category is selected, show **subcategories in a second horizontal tab bar below** (same style, slightly smaller)
- Maintains the clean horizontal scroll aesthetic
- Clear visual hierarchy with two levels
- **Example:**
  ```
  [All] [Main Courses] [Desserts] [Drinks] ← Parent tabs
         [Appetizers] [Entrees] [Sides]     ← Child tabs (when Main Courses selected)
  ```

**Option 2: Flat with Parent → Child Format**
- Show all categories (parent and children) in the same horizontal scroll
- Display subcategories as: **"Parent > Child"** (e.g., "Main Courses > Appetizers")
- Use visual indicator (chevron/separator) between parent and child
- Simple, but can get long names
- **Example:**
  ```
  [All] [Main Courses] [Main Courses > Appetizers] [Main Courses > Entrees] [Desserts]
  ```

**Option 3: Dropdown on Parent Tabs**
- Keep parent categories in the horizontal bar
- When clicking/hovering a parent, show a dropdown with subcategories
- Maintains horizontal space
- Works well for many subcategories
- **Example:**
  ```
  [All] [Main Courses ▼] [Desserts] [Drinks]
         ├─ Appetizers
         ├─ Entrees
         └─ Sides
  ```

**Option 4: Indented Subcategories in Same Row**
- Show all categories in the same horizontal scroll
- Subcategories are visually indented/smaller with a prefix icon (→ or •)
- Still horizontal, but shows hierarchy
- **Example:**
  ```
  [All] [Main Courses] [→ Appetizers] [→ Entrees] [Desserts]
  ```

**Recommendation:** **Option 1 (Two-Level Horizontal Tabs)** - Best UX, maintains your clean design, and scales well.

#### **Other UI/UX Considerations**
- ✅ Tree view with expand/collapse (for admin)
- ✅ Visual indentation for subcategories (admin)
- ✅ Breadcrumb navigation (Parent > Child) - useful in product view
- ✅ Language selector/toggle
- ✅ Default to business language setting

---

## 📁 **SUMMARY OF FILES TO MODIFY**

### Database:
1. `prisma/schema.prisma`

### Admin API Routes:
2. `src/app/api/admin/stores/[businessId]/categories/route.ts` (GET, POST)
3. `src/app/api/admin/stores/[businessId]/categories/[categoryId]/route.ts` (GET, PUT, PATCH, DELETE)
4. `src/app/api/admin/stores/[businessId]/categories/reorder/route.ts`

### Admin Components:
5. `src/components/admin/categories/CategoriesManagement.tsx`
6. `src/components/admin/products/ProductForm.tsx`
7. `src/components/admin/products/ProductsManagement.tsx`

### Storefront API:
8. `src/app/api/storefront/[slug]/route.ts`

### Storefront Components:
9. `src/components/storefront/StoreFront.tsx`

### Type Definitions:
10. `src/types/index.ts`
11. `src/components/setup/steps/ProductSetupStep.tsx`

### Setup:
12. `src/components/setup/steps/ProductSetupStep.tsx`
13. `src/app/api/setup/progress/route.ts` (include parentId, nameAl, descriptionAl in response)
14. `src/app/api/setup/save-progress/route.ts` (handle parentId, nameAl, descriptionAl when saving)

---

**Total: ~14 files to modify**
