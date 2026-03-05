# WaveOrder Flows - Phase 1 Implementation

**Status:** Complete  
**Date:** March 2026  
**Reference:** [PRD_WAVEORDER_FLOWS.md](./PRD_WAVEORDER_FLOWS.md)

## What Was Built

### Phase 1 — Foundation ✅

- **Twilio incoming webhook:** `POST /api/webhooks/twilio/incoming`
  - Receives WhatsApp messages from Twilio
  - Finds business by matching webhook "To" number to `Business.whatsappNumber` or `WhatsAppSettings.phoneNumber`
  - Creates/updates conversation and stores message
  - Configure this URL in Twilio Console: Messaging → Settings → Webhook

- **Prisma models:**
  - `WhatsAppConversation` — one per customer phone per business
  - `WhatsAppMessage` — individual messages (inbound/outbound)
  - `WhatsAppSettings` — enable/disable, phone number, business hours (for Phase 2)

- **Admin sidebar:** "WaveOrder Flows" (Business plan only)
  - Conversations — inbox view
  - Flows — placeholder for Phase 2
  - Settings — enable, phone number, webhook URL, business hours

- **Conversations inbox:**
  - Left panel: conversation list with search
  - Right panel: message thread + reply input
  - Manual reply sends via Twilio (24-hour window applies)
  - Mark as read when viewing

- **Settings page:**
  - Enable/disable WaveOrder Flows
  - WhatsApp number (for webhook routing)
  - Webhook URL display + copy
  - Connection test button (verifies Twilio credentials)
  - Business hours (used by Phase 2 flows)

## Plan Gating

WaveOrder Flows is **Business plan only**. Starter and Pro plans see an upgrade prompt if they navigate directly.

## Setup

1. Run Prisma: `npx prisma generate && npx prisma db push`
2. Configure Twilio webhook: `https://your-domain.com/api/webhooks/twilio/incoming`
3. Ensure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` are set
4. Enable WaveOrder Flows in Settings and set your business WhatsApp number

## Phase 2 — Welcome & Away Messages ✅ (March 2026)

- **WhatsAppFlow** Prisma model
- **Flow engine** (`src/lib/whatsapp-flow-engine.ts`): trigger matching, step execution
- **Business hours** check with timezone support
- **Default flows** (`src/lib/whatsapp-default-flows.ts`): auto-created on settings enable
  - Welcome: first message + during hours → text + catalog URL
  - Away: any message + outside hours → text with business hours
- **Settings UI**: welcome/away toggles
- **Steps supported**: send_text, send_image, send_url, notify_team

## Phase 3 — Custom Flows ✅ (March 2026)

- **Flows API**: GET/POST /flows, GET/PUT/DELETE /flows/[id], PATCH /flows/[id]/toggle
- **Flows list page**: Table with name, type, status, edit/delete/toggle
- **Flow editor**: Form-based modal with trigger config (type, keywords, button payload, hours) and step builder
- **Step types**: send_text, send_image, send_url, send_location, notify_team
- **Pre-built templates**: Welcome, Away, FAQ (menu), Order Redirect, Location
- **send_location** in flow engine: sends text with address + Google Maps link (or address only)

## Phase 4 — Polish & Extras ✅ (March 2026)

- **Unread badge**: Sidebar shows unread count next to "Conversations" (fetched from `/api/.../unread-count`) for Business plan
- **Flow analytics**: Flows table shows `triggerCount` and `lastTriggeredAt` columns (hidden on very small screens)
- **Media upload**: Flow editor has "Upload" button for send_image steps; uploads via `/api/admin/stores/[id]/upload` with `folder: flows`
- **Mobile-responsive inbox**: On small screens, selecting a conversation shows thread full-width with back button; list hidden when thread visible
- **businessStorage** flows folder: images resized 800×800, JPEG 90

## TODO Later

- Unit tests for Phase 1, 2 & 3
- Template management (view approved templates) — optional

## Next Steps (Phase 5+)

- Visual Flow Builder (drag-and-drop canvas)
