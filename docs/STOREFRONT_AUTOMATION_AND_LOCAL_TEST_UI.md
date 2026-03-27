# Task: Storefront automation tests + local test panel UI

This document describes work done for **more automation around the end-user / storefront experience** (not admin dashboards), plus the **Vitest browser UI** for local development.

For the **full test inventory** (all 18 files, 94 cases, including non-storefront areas), see [`TEST_SUITE.md`](./TEST_SUITE.md).

---

## 1. Scope: “storefront / customer-facing” vs admin

**In scope for this task (customer journey & public surfaces):**

| Area | Test file(s) | Cases (approx.) | What it guards |
|------|----------------|------------------|----------------|
| Order rules & copy | `src/__tests__/lib/storefront-order-validation.test.ts` | 33 | When checkout is blocked, primary blocker codes, button/footer/error helpers (`src/lib/storefront-order-validation.ts`) |
| Phone field | `src/__tests__/lib/storefront-phone.test.ts` | 3 | Basic required/length checks for checkout phone (`src/lib/storefront-phone.ts`) |
| Store URL slug | `src/__tests__/lib/storefront-slug.test.ts` | 1 | Case-insensitive slug resolution (`src/lib/storefront-slug.ts`) |
| Primary CTA | `src/__tests__/components/StorefrontOrderSubmitButton.test.tsx` | 4 | Place-order / WhatsApp control enabled/disabled, click, label/hint (`StorefrontOrderSubmitButton.tsx`) |
| Website embed URLs | `src/__tests__/lib/website-embed-url.test.ts` | 7 | Embed query params, UTM tags, base URL for snippets (`src/lib/website-embed-url.ts`) |
| Website embed settings | `src/__tests__/lib/website-embed-settings.test.ts` | 3 | JSON shape / defaults for embed config (`src/lib/website-embed-settings.ts`) |

**Total for this slice:** **51 tests** in **6 files** (counts match Vitest when you run the storefront subset command below).

**Related but not “customer UI”:** `storefront-404-spam.test.ts` exercises **SuperAdmin system log** filtering for probe/scanner URLs (`src/lib/storefront-404-spam.ts`). It lives in the same suite but targets **operations/admin visibility**, not the storefront checkout UI.

---

## 2. What we implemented

### 2.1 Stronger storefront validation tests

- Expanded **`storefront-order-validation.test.ts`** to cover **unhappy paths** and **all** primary blocker branches used for display (e.g. closed store, delivery area, cart empty, name/phone, retail/invoice/minimum/schedule, etc.), plus smoke coverage for formatting helpers.
- Kept tests **unit-level** (pure functions + one component), fast in CI, no live browser required for the default `yarn test` run.

### 2.2 CI so bad changes fail the pipeline

- **Workflow:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
- **Triggers:** `pull_request`, and `push` to **`stage`** and **`main`**.
- **Steps:** checkout → Node 22 + Yarn cache → `yarn install --frozen-lockfile` → `npx prisma generate` → **`yarn test`** → **`yarn typecheck`** (`tsc --noEmit`). (Lint is not a CI gate; same idea as `eslint.ignoreDuringBuilds` on build.)
- Any failing step fails the job (red checks on PRs).

### 2.3 `typecheck` script

- **`package.json`:** `"typecheck": "tsc --noEmit"` so TypeScript is checked in CI alongside tests.

### 2.4 Extra: Tests panel UI for local development

Goal: a **browser UI** to browse tests, re-run, and see pass/fail without relying only on the terminal.

| Piece | Purpose |
|--------|--------|
| **`@vitest/ui@2.1.9`** | Pinned to the same major line as **Vitest 2.1.x** (a bare `^` on `@vitest/ui` can resolve to v4 and mismatch Vitest). |
| **`@testing-library/jest-dom`** | DOM matchers (`toBeInTheDocument`, etc.) for component tests. |
| **`vitest.setup.ts`** (repo root) | `import '@testing-library/jest-dom/vitest'` |
| **`vitest.config.ts`** | `test.setupFiles: ['./vitest.setup.ts']` |
| **`package.json` script** | `"test:ui": "vitest --ui"` |

**Run locally:** `yarn test:ui` — opens the Vitest UI (default API port **51204**, path like `/__vitest__/`). **Not used in CI** (CI runs `yarn test` headless).

---

## 3. Commands cheat sheet

```bash
# Full suite (CI parity for tests)
yarn test

# Storefront / customer-facing subset only
yarn vitest run \
  src/__tests__/lib/storefront-order-validation.test.ts \
  src/__tests__/lib/storefront-phone.test.ts \
  src/__tests__/lib/storefront-slug.test.ts \
  src/__tests__/components/StorefrontOrderSubmitButton.test.tsx \
  src/__tests__/lib/website-embed-url.test.ts \
  src/__tests__/lib/website-embed-settings.test.ts

# Local browser test panel
yarn test:watch    # terminal watch
yarn test:ui       # Vitest UI
```

---

## 4. Not in this task (possible follow-ups)

- **HTTP integration tests** for storefront order `POST` routes (heavier, need test DB or mocks).
- **Playwright / E2E** against a deployed or preview environment.
- **Resolving existing `yarn typecheck` errors** elsewhere in the app (CI runs typecheck; fixing those is separate cleanup).

---

## 5. Revision note

Document reflects the automation work completed **March 2026** (storefront test expansion, CI, Vitest UI + jest-dom). Update the **51 / 6 files** figures if you add or remove storefront-facing tests.
