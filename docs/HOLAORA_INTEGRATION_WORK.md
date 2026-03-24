# HolaOra integration — who does what

**What HolaOra must provide** vs **what WaveOrder must build**.

---

## From HolaOra (their deliverables)

These are on **HolaOra’s** side unless you explicitly agree otherwise.

| Item | Notes |
|------|--------|
| **Provisioning API** | HTTPS endpoint WaveOrder calls to create/update a tenant; stable contract (method, body, success + error shapes). |
| **Auth for WaveOrder → HolaOra** | How WaveOrder proves it’s allowed to provision (secret, HMAC, etc.) — documented and testable in staging. |
| **Idempotent provisioning** | Same `businessId` retried → same outcome, no duplicate tenants. |
| **Response data** | At minimum: HolaOra tenant/account id WaveOrder can store; optional one-time setup URL if HolaOra uses that for onboarding. |
| **Owner onboarding** | Clear rule: email invite, magic link, returned URL, or combination — so WaveOrder knows what to show in UI. |
| **Deprovisioning / suspend** | What happens when the WaveOrder bundle ends (disable tenant, archive, etc.) — endpoint or documented process. |
| **Server → WaveOrder catalog** | HolaOra backend uses WaveOrder’s **public API** with the business API key (no scraping admin UI). |
| **Embed** | Documented snippet or URL pattern: how storefront loads the widget given `holaoraAccountId` (or your id). |
| **Embed customization** | If WaveOrder should expose theme/language: **documented** params or postMessage — or state “dashboard only.” |
| **Staging + docs** | Base URL for non-prod, sample requests, error codes. |

---

## In WaveOrder (our build)

| Item | Notes |
|------|--------|
| **Data model** | e.g. `Business.holaoraAccountId` (or equivalent), nullable until provisioned. |
| **Provision on bundle** | Hook when subscription includes HolaOra: call HolaOra provisioning from **server** (webhook/cron/job — align with billing). |
| **Secrets & config** | Env (or secure store): HolaOra base URL, WaveOrder→HolaOra credentials; never in client JS. |
| **Retries / failures** | Queue or safe retries if HolaOra is down; alerting or manual reconcile path. |
| **SuperAdmin** | Master enable, base URL, bundle↔HolaOra mapping, optional internal tools to re-trigger provision. |
| **Business admin UX** | Short copy + link: “Open HolaOra” / “Complete setup” depending on HolaOra’s onboarding. |
| **Storefront** | Render embed where product wants it, using HolaOra’s documented embed + stored id. |
| **API keys for HolaOra** | Ensure each business has (or can issue) a WaveOrder API key HolaOra uses — process TBD with HolaOra. |
| **Tests** | Unit/integration for provisioning client, feature flags, and failure paths. |

---

## Joint decisions (both teams — record in Notion or docs)

These are **not** owned by one side alone. Agree on them, then **write the outcome in Notion or shared docs** so the contract is the written record (not a chat or a one-off call).

| Topic | What it means |
|--------|----------------|
| **Provisioning API contract** | Exact request/response JSON fields, HTTP status codes, and error bodies WaveOrder must handle when calling HolaOra to create or update a tenant. |
| **Owner onboarding** | Does HolaOra send the invite email to the business owner, or does WaveOrder show a “complete setup” link from the API response (or both)? Affects WaveOrder admin copy and UX. |
| **Cancel / end of bundle** | When the WaveOrder subscription no longer includes HolaOra: does HolaOra disable the tenant, archive data, read-only mode, etc.? |
| **Catalog API scope** | Which WaveOrder API endpoints HolaOra will call first (e.g. services, products), and agreed rate limits so neither side is surprised. |
