# Quick Test Checklist (5 Minutes)

## ⚡ Fastest Way to Test Before Deploy

### 1. Test Order Creation (2 minutes) ✅

**Test WITHOUT UTM:**
```
1. Open: http://localhost:3000/[your-store-slug]
2. Add product to cart
3. Complete order
✅ Expected: Order created successfully
```

**Test WITH UTM:**
```
1. Open: http://localhost:3000/[your-store-slug]?utm_campaign=test&utm_source=instagram
2. Add product to cart
3. Complete order
✅ Expected: Order created successfully
✅ Verify: Check order in admin - should have utmCampaign: "test"
```

---

### 2. Test Product Event Tracking (1 minute) ✅

```
1. Open: http://localhost:3000/[your-store-slug]?utm_campaign=event_test
2. Click on a product (view event)
3. Add product to cart (add_to_cart event)
✅ Expected: Events tracked in database with UTM params
```

**Quick DB Check:**
```javascript
// In MongoDB shell or Compass
db.ProductEvent.find({}).sort({createdAt: -1}).limit(1)
// Should show: utmCampaign: "event_test"
```

---

### 3. Test Campaign Analytics (2 minutes) ✅

**As PRO/BUSINESS User:**
```
1. Login as PRO/BUSINESS user
2. Go to: /admin/stores/[businessId]/analytics
3. Click "Campaign Analytics" card
✅ Expected: Campaign Analytics page loads
✅ Expected: Shows campaign data (if any exists)
```

**As STARTER User:**
```
1. Login as STARTER user
2. Go to: /admin/stores/[businessId]/analytics
✅ Expected: "Campaign Analytics" card NOT visible
3. Try direct URL: /admin/stores/[businessId]/analytics/campaigns
✅ Expected: Shows upgrade prompt
```

---

## ✅ If All Tests Pass → DEPLOY ✅

## ❌ If Any Test Fails → INVESTIGATE FIRST

---

## 🔍 What to Look For

**Good Signs:**
- ✅ Orders create successfully
- ✅ No errors in browser console
- ✅ No errors in server logs
- ✅ Campaign Analytics loads (PRO users)
- ✅ Upgrade prompt shows (STARTER users)

**Bad Signs:**
- ❌ Orders fail to create
- ❌ Errors in browser console
- ❌ Errors in server logs
- ❌ Storefront crashes
- ❌ Database errors

---

## 📞 Quick Verification Commands

```bash
# Check build
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check Prisma schema
npx prisma format
npx prisma generate
```

---

**Total Testing Time: ~5 minutes**

**If all pass → Safe to deploy** ✅
