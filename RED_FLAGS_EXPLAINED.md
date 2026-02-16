# Red Flags Explained: What to Look For

## 🚨 Red Flags = STOP DEPLOYMENT

These are critical errors that indicate something is broken. If you see ANY of these, **DO NOT DEPLOY** - investigate and fix first.

---

## 1. ❌ Orders Fail to Create

### What This Means:
When a customer tries to complete an order, it fails instead of creating the order successfully.

### How to Spot It:

**In Browser (Customer View):**
- ❌ Error message appears: "Failed to create order" or "Something went wrong"
- ❌ Order form doesn't submit
- ❌ Page shows error toast/notification
- ❌ Browser console shows red errors

**In Browser Console (F12 → Console tab):**
```
❌ Error: Failed to create order
❌ POST http://localhost:3000/api/storefront/[slug]/order 500 (Internal Server Error)
❌ TypeError: Cannot read property 'x' of undefined
```

**In Server Logs (Terminal running `npm run dev`):**
```
❌ Error: [Error message]
❌ POST /api/storefront/[slug]/order 500
❌ Prisma error: ...
```

**What to Do:**
- Check browser console for errors
- Check server terminal for error messages
- Try creating an order manually
- If it fails → **STOP, investigate the error**

---

## 2. ❌ Storefront Crashes

### What This Means:
The storefront page doesn't load at all, shows a blank white screen, or crashes when you try to use it.

### How to Spot It:

**Visual Signs:**
- ❌ Blank white screen (nothing loads)
- ❌ "Error" page or "Something went wrong" message
- ❌ Page loads but clicking anything crashes it
- ❌ Infinite loading spinner (never finishes loading)

**In Browser Console:**
```
❌ Uncaught Error: [Error message]
❌ TypeError: Cannot read property 'slug' of undefined
❌ ReferenceError: [variable] is not defined
❌ React Error: [Component] is not defined
```

**In Server Logs:**
```
❌ Error: Failed to render page
❌ GET /[slug] 500
❌ Error: [Stack trace]
```

**What to Do:**
- Open storefront URL: `http://localhost:3000/[your-store-slug]`
- If it's blank/error → **STOP, check console**
- Try refreshing the page
- If still broken → **STOP, investigate**

---

## 3. ❌ Database Errors

### What This Means:
MongoDB/Prisma can't read or write data correctly. This usually means schema changes broke something.

### How to Spot It:

**In Server Logs:**
```
❌ PrismaClientKnownRequestError: [Error]
❌ MongoError: [Error]
❌ Error: Field 'x' doesn't exist on model 'Order'
❌ Error: Cannot find field 'utmCampaign' in schema
❌ Error: Invalid field type
```

**In Browser Console (when API calls fail):**
```
❌ POST /api/storefront/[slug]/order 500
❌ Response: { "error": "Database error: ..." }
```

**Common Database Errors:**
- `Field doesn't exist` → Schema mismatch
- `Invalid field type` → Type mismatch
- `Connection error` → Database not running
- `Unique constraint failed` → Duplicate data

**What to Do:**
- Check server terminal for Prisma/MongoDB errors
- Run: `npx prisma generate` (regenerate Prisma client)
- Run: `npx prisma db push` (sync schema)
- If errors persist → **STOP, fix schema first**

---

## 4. ❌ TypeScript/Build Errors

### What This Means:
The code has type errors or won't compile. This means the code is broken before it even runs.

### How to Spot It:

**When Running `npm run build`:**
```
❌ Error: Type 'X' is not assignable to type 'Y'
❌ Error: Property 'utmCampaign' does not exist on type 'Order'
❌ Error: Cannot find module './components/...'
❌ Error: [file].tsx(123,45): error TS2345: ...
```

**In IDE (VS Code/Cursor):**
- ❌ Red squiggly lines under code
- ❌ Error messages when hovering over code
- ❌ TypeScript errors in "Problems" tab

**When Running `npm run dev`:**
```
❌ Failed to compile
❌ Error in [file].tsx
❌ Type errors found
```

**What to Do:**
- Run: `npm run build`
- If build fails → **STOP, fix TypeScript errors**
- Check IDE for red error indicators
- Fix all type errors before deploying

---

## ✅ How to Check for Red Flags (Quick Test)

### Step 1: Build Check
```bash
npm run build
```
**✅ Good:** Build completes successfully  
**❌ Bad:** Build fails with errors → **STOP**

---

### Step 2: TypeScript Check
```bash
npx tsc --noEmit
```
**✅ Good:** No errors  
**❌ Bad:** Type errors shown → **STOP**

---

### Step 3: Dev Server Check
```bash
npm run dev
```
**✅ Good:** Server starts, no errors in terminal  
**❌ Bad:** Errors on startup → **STOP**

---

### Step 4: Storefront Check
```
1. Open: http://localhost:3000/[your-store-slug]
2. Check browser console (F12)
```
**✅ Good:** Page loads, no red errors in console  
**❌ Bad:** Blank page or red errors → **STOP**

---

### Step 5: Order Creation Check
```
1. Add product to cart
2. Complete order
3. Check browser console
4. Check server terminal
```
**✅ Good:** Order created, no errors  
**❌ Bad:** Order fails or errors appear → **STOP**

---

## 🎯 Summary

**Red Flags = Critical Errors That Break Functionality**

| Red Flag | What It Means | How to Check |
|----------|---------------|--------------|
| **Orders Fail** | Can't create orders | Try creating an order |
| **Storefront Crashes** | Storefront doesn't load | Open storefront URL |
| **Database Errors** | Can't read/write data | Check server logs |
| **Build Errors** | Code won't compile | Run `npm run build` |

---

## ✅ Safe to Deploy When:

- ✅ `npm run build` completes successfully
- ✅ `npx tsc --noEmit` shows no errors
- ✅ Storefront loads without errors
- ✅ Orders can be created successfully
- ✅ No errors in browser console
- ✅ No errors in server logs

---

## 🚨 If You See Red Flags:

1. **STOP** - Don't deploy
2. **READ** the error message carefully
3. **CHECK** the file mentioned in the error
4. **FIX** the issue
5. **TEST** again
6. **ONLY DEPLOY** when all tests pass

---

## 📝 Example: What Good vs Bad Looks Like

### ✅ GOOD (Safe to Deploy):
```
$ npm run build
✓ Compiled successfully
✓ No errors

Browser Console: (empty, no errors)
Server Logs: POST /api/storefront/[slug]/order 200 OK
Order Created: ✅ Success
```

### ❌ BAD (STOP - Don't Deploy):
```
$ npm run build
✗ Error: Type 'string | null' is not assignable to type 'string'
✗ Build failed

Browser Console: ❌ Error: Cannot read property 'slug' of undefined
Server Logs: ❌ Prisma error: Field 'utmCampaign' doesn't exist
Order Created: ❌ Failed
```

---

**Remember: If you see ANY red flag → STOP and fix it before deploying!**
