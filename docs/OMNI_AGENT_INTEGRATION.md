# Omni Agent Integration – WaveOrder

This document describes how WaveOrder connects to Omni Agent for automated orchestration: indexing/SEO and contact form handling.

---

## Overview

| Agent | Business | Purpose |
|-------|----------|---------|
| **Index Agent** | WaveOrder | Request indexing for new storefronts, resubmit sitemap |
| **Contact Agent** | WaveOrder | Handle contact form, chatbot, onboarding abandonment: intent, lead, reply |
| **Pipeline Agent** | WaveOrder | Analyze archived businesses + leads; suggest prioritize vs cleanup |
| **Activity Agent** | WaveOrder | Flag active businesses with no/low activity: no orders, no products, no storefront pageviews |

All agents belong to the **WaveOrder** business in Omni Agent.

### Lead Sources (Contact Agent)

| Source | Event |
|--------|-------|
| Contact form | `contact_submitted` |
| Chatbot | `chatbot_lead_capture` |
| Onboarding abandoned | `onboarding_abandoned` |

---

## Architecture

```
WaveOrder                          Omni Agent Platform
    │                                        │
    │  POST webhook                          │
    ├───────────────────────────────────────►  Index Agent
    │  (business_live, sitemap_updated)      │     └── Google Indexing API
    │                                        │     └── Search Console API
    │                                        │
    │  POST webhook                          │
    ├───────────────────────────────────────►  Contact Agent
    │  (contact_submitted, onboarding_abandoned)  │     └── Intent classification
    │                                        │     └── Lead create/update
    │                                        │     └── Reply draft/send
    │                                        │
    │  POST webhook                          │
    ├───────────────────────────────────────►  Pipeline Agent
    │  (pipeline_analyze)                    │     └── Archived/leads analysis
    │                                        │     └── Prioritize vs cleanup suggestions
    │                                        │
    │  POST webhook                          │
    ├───────────────────────────────────────►  Activity Agent
    │  (low_activity_audit)                  │     └── No orders, no products, no pageviews
    │                                        │     └── Suggest outreach or follow-up
```

---

## Index Agent

### Purpose

- Request Google indexing when a new storefront goes live
- Resubmit sitemap when robots.txt or sitemap changes
- Optional: periodic indexing checks via Search Console API

### Events from WaveOrder

| Event | When | Payload |
|-------|------|---------|
| `business_live` | New storefront goes live (indexable) | `{ url, businessId, businessName }` |
| `sitemap_updated` | Sitemap or robots.txt changed | `{}` |

### Agent Actions

- Call **Google Indexing API** for `business_live` URL
- Call **Search Console API** to resubmit sitemap for `sitemap_updated`

### Connections Required

- Google service account (Indexing API + Search Console API)
- Service account must be Owner in Search Console for waveorder.app

### Google API Setup

1. [Google Cloud Console](https://console.cloud.google.com/) → Create/select project
2. Enable **Indexing API** and **Google Search Console API**
3. Create **Service Account** → Download JSON key
4. [Search Console](https://search.google.com/search-console) → Add service account email as **Owner** for waveorder.app

---

## Contact Agent

### Purpose

- Receive contact form submissions from WaveOrder
- Classify intent (sales, support, demo, partnership)
- Create or update lead
- Draft or send first reply
- Notify the right person

### Events from WaveOrder

| Event | When | Payload |
|-------|------|---------|
| `contact_submitted` | Someone submits the contact form | `{ submissionId, name, email, company, subject, message, location }` |
| `chatbot_lead_capture` | User provides email in chatbot (e.g. "I want a demo") | `{ sessionId, email, name?, message, source: 'chatbot' }` |
| `onboarding_abandoned` | User started onboarding but didn't complete (e.g. 24h since last step) | `{ userId, userEmail, lastStep, lastStepName, businessType, subscriptionPlan, hoursSinceLastActivity }` |

### Agent Actions

- **Intent classification** – sales, support, demo, partnership, etc.
- **Lead** – Create or update in WaveOrder (or external CRM)
- **Reply** – Draft and optionally send first response
- **Route** – Assign to team or system
- **Notify** – Alert owner or support

### Connections Required

- WaveOrder API (to create/update leads) – optional if agent only drafts
- Email (Resend/SendGrid) – to send replies
- Optional: LLM for intent and reply drafting

---

## Onboarding Abandonment (Contact Agent)

### Purpose

When users register but abandon onboarding (e.g. 24h since last step), Contact Agent receives `onboarding_abandoned` and can draft personalized emails, create/update lead, or queue for human follow-up.

### Funnel Drop-off Points

| Step | Name | Typical drop-off |
|------|------|-------------------|
| 4 | Store Creation | High |
| 11 | Store Ready | High |

### Step-Specific Automations

| Last step | Suggested automation |
|-----------|----------------------|
| **Step 4 – Store Creation** | "Having trouble creating your store? Reply with your business name and we'll set it up for you." |
| **Step 7 – Product Setup** | "Product setup can be quick – we can import from a spreadsheet or help you add your first products." |
| **Step 11 – Store Ready** | "You're almost there! One more click to go live. Need help with WhatsApp or final setup?" |

### WaveOrder Logic

- **Log types:** `onboarding_step_completed`, `onboarding_step_error`, `onboarding_completed`
- **Cron/scheduled job:** Runs every 6–12h, queries logs for users with last step &lt; 11 and no activity for 24h+
- **Webhook:** `notifyOmniAgent('contact', 'onboarding_abandoned', payload)`

### Other Funnel Candidates (same pattern)

- Trial → Paid conversion (14 days)
- Store live but no orders (7 days)
- Product setup incomplete (0 products after 3 days)
- WhatsApp not connected

---

## Pipeline Agent

### Purpose

- **Archived businesses:** Suggest which to prioritize for re-activation vs which are safe to permanently delete
- **Leads:** Suggest which to prioritize for follow-up, which to close, which are overdue

### Data Sources

| Source | WaveOrder API | Data |
|--------|---------------|------|
| Archived | `GET /api/superadmin/analytics/archived` | `incompleteBusinesses`, `inactiveBusinesses` |
| Leads | `GET /api/superadmin/leads` | Leads with status, priority, source, followUpAt |

### Archived Businesses – Agent Logic

| Reason pattern | Suggested action |
|----------------|------------------|
| **Country not supported** (Indonesia, Turkey, India) | **Prioritize** – re-activate when country is added |
| **Support needed for X** (Latin America, Brasil WhatsApp) | **Prioritize** – high intent, follow up when ready |
| **Testing / demo / duplicate** | **Safe to delete** – after grace period (e.g. 90 days) |
| **No response / tried to contact** | **Low priority** – or safe to delete after 6+ months |
| **Get back again / check later** | **Prioritize** – schedule follow-up |

### Leads – Agent Logic

| Condition | Suggested action |
|-----------|------------------|
| Stale + High priority | Prioritize follow-up |
| Overdue follow-up | Urgent – contact today |
| Unassigned | Assign or queue |
| Stale + 90+ days | Suggest close/lost |
| New + Demo request | Prioritize |

### Trigger Options

- **Scheduled:** WaveOrder cron pushes archived + leads snapshot to Pipeline Agent webhook
- **On-demand:** SuperAdmin clicks "Get suggestions" in Archived/Leads pages → API calls Agent

### Event: pipeline_analyze

Payload includes `inactiveBusinesses` and `leads`. Agent returns suggestions (prioritize vs safe to delete) as JSON or email report.

---

## Activity Agent

### Purpose

Flag **active** businesses with no or very low activity. Suggest outreach or follow-up to re-engage.

**Scope:** Active businesses only (`isActive: true`), **exclude test** (`testMode: false`).

### Conditions to Flag

| Condition | Data source | Meaning |
|-----------|-------------|---------|
| **No orders** | `Order` count = 0 | Business has never received an order |
| **No products** | `Product` count = 0 | Business has not added any products |
| **No storefront pageviews** | `VisitorSession` count = 0 | Storefront has never been visited (or no traffic) |

### Agent Logic

- Combine conditions: e.g. "no orders + no products" → likely never set up properly
- "No products + no pageviews" → store not shared or not discoverable
- "No orders but has products + pageviews" → conversion issue, different outreach
- Suggest: email owner, offer setup help, or schedule check-in

### Data Sources

| Source | WaveOrder API / Query | Data |
|--------|------------------------|------|
| Low-activity businesses | New: `GET /api/superadmin/analytics/low-activity` | Active businesses (excl. test) with orderCount, productCount, visitorSessionCount |

### Trigger

- **Scheduled:** Cron (e.g. weekly) fetches low-activity list, POSTs to Activity Agent webhook
- **On-demand:** SuperAdmin "Audit activity" button in analytics

### Event: low_activity_audit

Payload includes `lowActivityBusinesses`: `{ id, name, email, orderCount, productCount, visitorSessionCount, storeLiveAt }`.

---

## WaveOrder Changes

### 1. Environment Variables

```env
# Index Agent
OMNI_AGENT_INDEX_WEBHOOK_URL=https://omni-agent.com/agents/wo-index-xxx/webhook
OMNI_AGENT_INDEX_WEBHOOK_SECRET=xxx

# Contact Agent
OMNI_AGENT_CONTACT_WEBHOOK_URL=https://omni-agent.com/agents/wo-contact-xxx/webhook
OMNI_AGENT_CONTACT_WEBHOOK_SECRET=xxx

# Pipeline Agent
OMNI_AGENT_PIPELINE_WEBHOOK_URL=https://omni-agent.com/agents/wo-pipeline-xxx/webhook
OMNI_AGENT_PIPELINE_WEBHOOK_SECRET=xxx

# Activity Agent
OMNI_AGENT_ACTIVITY_WEBHOOK_URL=https://omni-agent.com/agents/wo-activity-xxx/webhook
OMNI_AGENT_ACTIVITY_WEBHOOK_SECRET=xxx
```

### 2. Webhook Helper

```typescript
// src/lib/omni-agent-webhook.ts
export async function notifyOmniAgent(
  agent: 'index' | 'contact' | 'pipeline' | 'activity',
  event: string,
  payload: Record<string, unknown>
) {
  const config = {
    index: { url: process.env.OMNI_AGENT_INDEX_WEBHOOK_URL, secret: process.env.OMNI_AGENT_INDEX_WEBHOOK_SECRET },
    contact: { url: process.env.OMNI_AGENT_CONTACT_WEBHOOK_URL, secret: process.env.OMNI_AGENT_CONTACT_WEBHOOK_SECRET },
    pipeline: { url: process.env.OMNI_AGENT_PIPELINE_WEBHOOK_URL, secret: process.env.OMNI_AGENT_PIPELINE_WEBHOOK_SECRET },
    activity: { url: process.env.OMNI_AGENT_ACTIVITY_WEBHOOK_URL, secret: process.env.OMNI_AGENT_ACTIVITY_WEBHOOK_SECRET },
  }
  const { url, secret } = config[agent]

  if (!url) return

  const body = JSON.stringify({
    event,
    ...payload,
    timestamp: new Date().toISOString(),
  })

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': secret || '',
    },
    body,
  }).catch((err) => console.error(`Omni Agent (${agent}) webhook failed:`, err))
}
```

### 3. Call Sites

| Event | Location | Call |
|-------|----------|------|
| `business_live` | Setup complete, or when business becomes indexable | `notifyOmniAgent('index', 'business_live', { url, businessId, businessName })` |
| `sitemap_updated` | After deploy or manual trigger | `notifyOmniAgent('index', 'sitemap_updated', {})` |
| `contact_submitted` | Contact form API (after saving to DB) | `notifyOmniAgent('contact', 'contact_submitted', { submissionId, name, email, company, subject, message, location })` |
| `chatbot_lead_capture` | Chatbot when user provides email | `notifyOmniAgent('contact', 'chatbot_lead_capture', { sessionId, email, name, message })` |
| `onboarding_abandoned` | Cron/scheduled job (detects 24h+ since last step) | `notifyOmniAgent('contact', 'onboarding_abandoned', { userId, userEmail, lastStep, lastStepName, businessType, subscriptionPlan, hoursSinceLastActivity })` |
| `pipeline_analyze` | Cron (daily) or on-demand from Archived/Leads page | `notifyOmniAgent('pipeline', 'pipeline_analyze', { inactiveBusinesses, leads })` |
| `low_activity_audit` | Cron (weekly) or on-demand from analytics | `notifyOmniAgent('activity', 'low_activity_audit', { lowActivityBusinesses })` |

---

## Webhook Payload Format

### Index Agent – business_live

```json
{
  "event": "business_live",
  "url": "https://waveorder.app/naia-studio",
  "businessId": "abc123",
  "businessName": "Naia Studio",
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

### Index Agent – sitemap_updated

```json
{
  "event": "sitemap_updated",
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

### Contact Agent – contact_submitted

```json
{
  "event": "contact_submitted",
  "submissionId": "xyz789",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Inc",
  "subject": "General",
  "message": "I'd like to learn more about WaveOrder.",
  "location": "Toronto, Canada",
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

### Contact Agent – chatbot_lead_capture

```json
{
  "event": "chatbot_lead_capture",
  "sessionId": "chat-abc123",
  "email": "visitor@example.com",
  "name": "Jane",
  "message": "I'd like to schedule a demo",
  "source": "chatbot",
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

### Contact Agent – onboarding_abandoned

```json
{
  "event": "onboarding_abandoned",
  "userId": "69b4bb7de02d41a5cd9a65a8",
  "userEmail": "elzumbie10@gmail.com",
  "lastStep": 4,
  "lastStepName": "Store Creation",
  "businessType": "RETAIL",
  "subscriptionPlan": "PRO",
  "hoursSinceLastActivity": 48,
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

### Pipeline Agent – pipeline_analyze

```json
{
  "event": "pipeline_analyze",
  "inactiveBusinesses": [
    {
      "id": "xxx",
      "name": "My Business",
      "email": "scopdux@gmail.com",
      "deactivatedAt": "2026-03-09",
      "deactivationReason": "Indonesia Country not Supported"
    }
  ],
  "leads": [
    {
      "id": "xxx",
      "name": "Suhas",
      "email": "suhas.msv@gmail.com",
      "company": "Brinzo",
      "status": "STALE",
      "priority": "HIGH",
      "followUpAt": null,
      "createdAt": "2026-02-10"
    }
  ],
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

### Activity Agent – low_activity_audit

```json
{
  "event": "low_activity_audit",
  "lowActivityBusinesses": [
    {
      "id": "xxx",
      "name": "My Business",
      "email": "owner@example.com",
      "orderCount": 0,
      "productCount": 0,
      "visitorSessionCount": 0,
      "storeLiveAt": "2026-02-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

---

## Security

- **Secret header:** WaveOrder sends `X-Webhook-Secret`; Omni Agent verifies it.
- **HTTPS:** All webhooks over HTTPS.
- **Optional:** HMAC signature in header for stronger verification.

---

## Omni Agent Platform Setup

1. **Create business:** WaveOrder
2. **Create Index Agent** under WaveOrder
   - Add Google connection (service account)
   - Copy webhook URL and secret → WaveOrder env
3. **Create Contact Agent** under WaveOrder
   - Add email connection (optional)
   - Add WaveOrder API connection (optional, for leads)
   - Copy webhook URL and secret → WaveOrder env
4. **Create Pipeline Agent** under WaveOrder
   - Copy webhook URL and secret → WaveOrder env
5. **Create Activity Agent** under WaveOrder
   - Copy webhook URL and secret → WaveOrder env

---

## Related Docs

- [WAVEORDER_BLOG_AND_CHATBOT.md](./WAVEORDER_BLOG_AND_CHATBOT.md) – Blog and Chatbot features

---

## References

- [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart)
- [Google Search Console API](https://developers.google.com/webmaster-tools/search-console-api-original)
- [Sitemap ping deprecated](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping)
