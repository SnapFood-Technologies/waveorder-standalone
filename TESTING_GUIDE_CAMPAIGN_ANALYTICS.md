# Testing Guide: Campaign Analytics & UTM Tracking

## 🧪 Pre-Deployment Testing Checklist

### Phase 1: Test Order Creation (CRITICAL) ✅

**Goal**: Verify orders can still be created with and without UTM params

#### Test 1.1: Order WITHOUT UTM params (Backward Compatibility)
1. **Open storefront**: `http://localhost:3000/[your-store-slug]`
2. **Add product to cart** (no UTM params in URL)
3. **Complete order** with:
   - Customer name
   - Phone number
   - Delivery address
   - Payment method
4. **Expected Result**: ✅ Order created successfully
5. **Verify in Admin**: Check order details - `sessionId` and UTM fields should be `null` or empty

#### Test 1.2: Order WITH UTM params
1. **Open storefront with UTM**: `http://localhost:3000/[your-store-slug]?utm_campaign=test_sale&utm_source=instagram&utm_medium=social`
2. **Add product to cart**
3. **Complete order**
4. **Expected Result**: ✅ Order created successfully
5. **Verify in Admin**: Check order details - should have:
   - `sessionId` populated
   - `utmCampaign: "test_sale"`
   - `utmSource: "instagram"`
   - `utmMedium: "social"`

#### Test 1.3: Order with Affiliate Link (UTM Campaign = Tracking Code)
1. **Create an affiliate** (if affiliate system enabled):
   - Go to `/admin/stores/[businessId]/affiliates/create`
   - Create affiliate with tracking code: `TEST_AFFILIATE`
2. **Open storefront**: `http://localhost:3000/[your-store-slug]?utm_campaign=TEST_AFFILIATE&utm_source=affiliate`
3. **Complete order**
4. **Expected Result**: ✅ Order created with `affiliateId` linked

---

### Phase 2: Test Product Event Tracking ✅

**Goal**: Verify product views/add_to_cart events are tracked with UTM params

#### Test 2.1: Product View WITHOUT UTM
1. **Open storefront**: `http://localhost:3000/[your-store-slug]` (no UTM)
2. **Click on a product** (opens product modal)
3. **Expected Result**: ✅ Product view event tracked
4. **Verify in Database**:
   ```javascript
   // Check ProductEvent collection
   db.ProductEvent.find({}).sort({createdAt: -1}).limit(1)
   // Should show: eventType: "view", utmSource: null, utmCampaign: null
   ```

#### Test 2.2: Product View WITH UTM
1. **Open storefront**: `http://localhost:3000/[your-store-slug]?utm_campaign=summer_sale&utm_source=google`
2. **Click on a product**
3. **Expected Result**: ✅ Product view event tracked with UTM
4. **Verify in Database**:
   ```javascript
   db.ProductEvent.find({}).sort({createdAt: -1}).limit(1)
   // Should show: eventType: "view", utmCampaign: "summer_sale", utmSource: "google"
   ```

#### Test 2.3: Add to Cart WITH UTM
1. **Open storefront**: `http://localhost:3000/[your-store-slug]?utm_campaign=test&utm_source=facebook`
2. **Add product to cart**
3. **Expected Result**: ✅ Add to cart event tracked with UTM
4. **Verify in Database**:
   ```javascript
   db.ProductEvent.find({eventType: "add_to_cart"}).sort({createdAt: -1}).limit(1)
   // Should show: eventType: "add_to_cart", utmCampaign: "test", utmSource: "facebook"
   ```

#### Test 2.4: UTM Persistence Across Navigation
1. **Open storefront**: `http://localhost:3000/[your-store-slug]?utm_campaign=persist_test`
2. **Navigate to different pages** (category, search, etc.)
3. **Click on product** (should still have UTM)
4. **Expected Result**: ✅ UTM params persist in localStorage
5. **Verify**: Check browser console:
   ```javascript
   localStorage.getItem('utm_params_[your-store-slug]')
   // Should return: {"utm_campaign":"persist_test",...}
   ```

---

### Phase 3: Test Campaign Analytics API ✅

**Goal**: Verify Campaign Analytics endpoint works correctly

#### Test 3.1: API Endpoint (PRO/BUSINESS Plan)
1. **Ensure business has PRO or BUSINESS plan**
2. **Create test data**:
   - Create product events with UTM params
   - Create orders with UTM params
3. **Call API**: `GET /api/admin/stores/[businessId]/analytics/campaigns?period=month`
4. **Expected Result**: ✅ Returns campaign data
5. **Verify Response**:
   ```json
   {
     "data": {
       "campaigns": [
         {
           "campaign": "summer_sale",
           "source": "instagram",
           "medium": "social",
           "views": 10,
           "addToCarts": 5,
           "orders": 2,
           "revenue": 50.00,
           "conversionRate": 20.0
         }
       ],
       "summary": { ... }
     }
   }
   ```

#### Test 3.2: API Endpoint (STARTER Plan - Should Fail)
1. **Set business to STARTER plan**
2. **Call API**: `GET /api/admin/stores/[businessId]/analytics/campaigns`
3. **Expected Result**: ✅ Returns 403 Forbidden
4. **Verify Response**:
   ```json
   {
     "message": "Campaign Analytics is only available for PRO and BUSINESS plans"
   }
   ```

---

### Phase 4: Test Campaign Analytics UI ✅

**Goal**: Verify Campaign Analytics page works correctly

#### Test 4.1: Access Campaign Analytics (PRO/BUSINESS)
1. **Login as PRO/BUSINESS user**
2. **Navigate to**: `/admin/stores/[businessId]/analytics`
3. **Click**: "Campaign Analytics" card in "Advanced Insights" section
4. **Expected Result**: ✅ Redirects to Campaign Analytics page
5. **Verify Page Loads**: Should show:
   - Summary cards (Active Campaigns, Views, Orders, Revenue)
   - Campaign performance table
   - Period filter dropdown

#### Test 4.2: Campaign Analytics (STARTER Plan)
1. **Login as STARTER user**
2. **Navigate to**: `/admin/stores/[businessId]/analytics`
3. **Expected Result**: ✅ "Campaign Analytics" card NOT visible
4. **Try direct URL**: `/admin/stores/[businessId]/analytics/campaigns`
5. **Expected Result**: ✅ Shows upgrade prompt

#### Test 4.3: Campaign Performance Table
1. **Open Campaign Analytics page**
2. **Verify Table Shows**:
   - Campaign name
   - Source
   - Medium
   - Views count
   - Add to Cart count
   - Orders count (linked via sessionId)
   - Revenue
   - Conversion rates
3. **Test Period Filter**: Change to "Today", "This Week", "All Time"
4. **Expected Result**: ✅ Data updates correctly

---

### Phase 5: Test Conversion Tracking Accuracy ✅

**Goal**: Verify events are correctly linked to orders via sessionId

#### Test 5.1: Full Conversion Flow
1. **Open storefront**: `http://localhost:3000/[your-store-slug]?utm_campaign=conversion_test`
2. **View product** → Should create ProductEvent with sessionId
3. **Add to cart** → Should create ProductEvent with same sessionId
4. **Complete order** → Should create Order with same sessionId
5. **Expected Result**: ✅ Campaign Analytics shows:
   - Views: 1
   - Add to Cart: 1
   - Orders: 1
   - Conversion Rate: 100% (1 view → 1 order)

#### Test 5.2: Abandoned Cart Detection
1. **Open storefront**: `http://localhost:3000/[your-store-slug]?utm_campaign=abandon_test`
2. **Add product to cart** → Creates ProductEvent
3. **Don't complete order** → No Order created
4. **Expected Result**: ✅ Campaign Analytics shows:
   - Views: 1
   - Add to Cart: 1
   - Orders: 0
   - Conversion Rate: 0%

---

### Phase 6: Test Edge Cases ✅

#### Test 6.1: localStorage Unavailable
1. **Disable localStorage** in browser (or use incognito with restrictions)
2. **Open storefront** with UTM params
3. **Track product event**
4. **Expected Result**: ✅ Event still tracked (UTM = null)

#### Test 6.2: Invalid UTM JSON in localStorage
1. **Manually set invalid JSON**: 
   ```javascript
   localStorage.setItem('utm_params_[slug]', 'invalid-json')
   ```
2. **Track product event**
3. **Expected Result**: ✅ Event tracked (parse error ignored, UTM = null)

#### Test 6.3: Missing UTM Params
1. **Open storefront** without UTM params
2. **Track events and create order**
3. **Expected Result**: ✅ Everything works, UTM fields = null

#### Test 6.4: Empty Campaign Analytics
1. **Create business with no UTM events**
2. **Open Campaign Analytics**
3. **Expected Result**: ✅ Shows "No Campaign Data" message

---

## 🔍 Manual Testing Steps

### Quick Test Script (5 minutes)

```bash
# 1. Start your dev server
npm run dev

# 2. Test Order Creation
# Open: http://localhost:3000/[slug]?utm_campaign=test
# Add product → Complete order
# Verify: Order created successfully

# 3. Test Product Events
# Open: http://localhost:3000/[slug]?utm_campaign=test2
# View product → Add to cart
# Verify: Events tracked in database

# 4. Test Campaign Analytics
# Login as PRO user
# Navigate: /admin/stores/[businessId]/analytics/campaigns
# Verify: Page loads, shows campaign data
```

---

## 📊 Database Verification Queries

### Check ProductEvents with UTM
```javascript
// MongoDB
db.ProductEvent.find({
  utmCampaign: { $ne: null }
}).sort({ createdAt: -1 }).limit(10)

// Should show events with UTM params
```

### Check Orders with UTM
```javascript
// MongoDB
db.Order.find({
  utmCampaign: { $ne: null }
}).sort({ createdAt: -1 }).limit(10)

// Should show orders with UTM params
```

### Verify sessionId Linking
```javascript
// Find a sessionId that has both events and orders
db.ProductEvent.aggregate([
  { $match: { sessionId: { $ne: null } } },
  { $group: { _id: "$sessionId", events: { $sum: 1 } } },
  { $lookup: {
      from: "Order",
      localField: "_id",
      foreignField: "sessionId",
      as: "orders"
    }
  },
  { $match: { "orders.0": { $exists: true } } }
])

// Should show sessionIds that have both events and orders
```

---

## ✅ Success Criteria

**All tests must pass:**

- [x] Orders can be created WITHOUT UTM params
- [x] Orders can be created WITH UTM params
- [x] Product events tracked WITHOUT UTM params
- [x] Product events tracked WITH UTM params
- [x] UTM params persist across page navigation
- [x] Campaign Analytics API returns data (PRO/BUSINESS)
- [x] Campaign Analytics API returns 403 (STARTER)
- [x] Campaign Analytics UI loads (PRO/BUSINESS)
- [x] Campaign Analytics UI shows upgrade prompt (STARTER)
- [x] Conversion tracking links events to orders via sessionId
- [x] Edge cases handled gracefully (localStorage fails, invalid JSON, etc.)

---

## 🚨 Red Flags (STOP if these occur)

**DO NOT DEPLOY if:**
- ❌ Orders fail to create (with or without UTM)
- ❌ Product events fail to track
- ❌ Storefront crashes or shows errors
- ❌ Database errors in logs
- ❌ TypeScript/build errors

**These indicate breaking changes - investigate immediately!**

---

## 📝 Post-Deployment Verification

After deployment, verify in production:

1. **Test order creation** (with and without UTM)
2. **Check browser console** for errors
3. **Check server logs** for errors
4. **Verify Campaign Analytics** loads (PRO/BUSINESS users)
5. **Monitor for 30 minutes** - watch for any errors

---

## 🎯 Expected Test Results

**All tests should show:**
- ✅ Orders work exactly as before
- ✅ Product events track correctly
- ✅ UTM params captured when available
- ✅ Campaign Analytics shows accurate data
- ✅ No errors in console or logs
- ✅ Backward compatibility maintained

**If all tests pass → SAFE TO DEPLOY** ✅
