# WaveOrder Flows — Product Requirements Document

**Version:** 1.0
**Date:** February 22, 2026
**Status:** Draft
**Author:** WaveOrder Engineering

---

## 1. Overview

**WaveOrder Flows** is a WhatsApp messaging automation module built into the WaveOrder admin panel. It enables businesses to receive, manage, and automate WhatsApp conversations with their customers — including welcome messages, away messages, interactive buttons, and simple keyword-based flows.

It is NOT a full conversational AI platform. It is a focused, opinionated automation tool that covers the 80% of use cases that WaveOrder businesses actually need — without the complexity of platforms like ChatDaddy, Respond.io, or WATI.

---

## 2. Problem Statement

WaveOrder currently sends **outbound** WhatsApp order notifications via Twilio, but has zero capability for:

- Receiving and displaying incoming customer messages
- Auto-replying with welcome or away messages
- Sending interactive messages (buttons, images, quick replies)
- Automating common conversation patterns (FAQs, order links, location sharing)

Businesses like Viridian Bakery are paying for separate tools (ChatDaddy ~$40-80/mo) just to handle basic WhatsApp automation that could live natively inside WaveOrder.

### Business Value

- **Retention:** Businesses stay on WaveOrder instead of needing a separate tool
- **Revenue:** Flows is a Business plan exclusive feature, driving upgrades
- **Differentiation:** No competing catalog platform offers built-in WhatsApp automation
- **Upsell path:** WaveOrder Flows is a compelling reason to upgrade to Business

---

## 3. Goals & Non-Goals

### Goals

- Businesses can receive and reply to WhatsApp messages from the admin panel
- Businesses can configure automated welcome and away messages
- Businesses can create simple keyword/button-triggered flows with text, images, and buttons
- The module works with the existing Twilio integration (no new WhatsApp BSP needed)
- Available as a new "WaveOrder Flows" section in the admin sidebar
- Zero impact on existing order flow, storefront, or WhatsApp notification system

### Non-Goals

- Replacing ChatDaddy for power users with 50+ flow nodes
- Full CRM or contact management system
- Replacing existing WhatsApp order notification system

---

## 4. User Stories

### Business Owner (Admin)

1. **As a business owner**, I want to see all incoming WhatsApp messages in my admin panel, so I don't need a separate app to manage customer conversations.

2. **As a business owner**, I want to set up a welcome message that automatically replies when a customer messages me for the first time, so customers get an immediate response.

3. **As a business owner**, I want to set up an away message that sends automatically outside business hours, so customers know when I'll respond.

4. **As a business owner**, I want my welcome message to include an image of my store and buttons like "Order Now", "Location & Hours", and "Help", so customers can quickly find what they need.

5. **As a business owner**, I want to create simple flows that respond to button clicks or keywords (e.g., "menu" triggers the catalog link), so common questions are answered automatically.

6. **As a business owner**, I want to see conversation history with each customer, so I have context when replying manually.

### Customer (End User)

7. **As a customer**, I want to message a business on WhatsApp and get an instant welcome message with options, so I can quickly browse or order.

8. **As a customer**, I want to tap a button like "Order Now" and get a direct link to the storefront, so I don't have to ask for it.

9. **As a customer**, I want to know if a business is closed and when they'll be back, so I don't wait for a reply that won't come.

---

## 5. Architecture

### Infrastructure

```
Customer WhatsApp
        │
        ▼
   Twilio Cloud
        │
        ▼ (webhook POST)
┌─────────────────────────────────┐
│  /api/webhooks/twilio/incoming  │  ← New webhook endpoint
│                                 │
│  1. Parse incoming message      │
│  2. Find business by phone      │
│  3. Store message in DB         │
│  4. Run flow engine             │
│  5. Send auto-reply if matched  │
└─────────────────────────────────┘
        │
        ▼
   Twilio API (send reply)
        │
        ▼
   Customer WhatsApp
```

### Existing Integration

- **Twilio** is already configured with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- Outbound messaging already works via `src/lib/twilio.ts`
- We extend this — not replace it

### New Twilio Capabilities Needed

| Feature | Twilio Support | Notes |
|---|---|---|
| Receive incoming messages | Webhook URL | Configure in Twilio console |
| Send text replies | `Messages.create` | Already implemented |
| Send interactive buttons | `ContentSid` with template | Requires approved template |
| Send images/media | `MediaUrl` parameter | Supported on freeform & template |
| Send location | Template with location | Requires template |
| Read receipts | Webhook status callbacks | Optional, Phase 4 |

---

## 6. Data Model

### New Prisma Models

```prisma
model WhatsAppConversation {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId     String   @db.ObjectId
  customerPhone  String
  customerName   String?
  lastMessageAt  DateTime
  lastMessageBy  String   // "customer" | "business" | "flow"
  isRead         Boolean  @default(false)
  status         String   @default("open") // "open" | "closed"

  business Business              @relation(fields: [businessId], references: [id], onDelete: Cascade)
  messages WhatsAppMessage[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([businessId, customerPhone])
  @@index([businessId, lastMessageAt])
  @@index([businessId, isRead])
}

model WhatsAppMessage {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  conversationId  String   @db.ObjectId
  direction       String   // "inbound" | "outbound"
  sender          String   // "customer" | "business" | "flow"
  messageType     String   // "text" | "image" | "video" | "button_reply" | "interactive"
  body            String?
  mediaUrl        String?
  buttonPayload   String?  // Button ID clicked by customer
  twilioMessageId String?  // Twilio SID for tracking
  flowId          String?  @db.ObjectId // Which flow generated this (if auto-reply)

  conversation WhatsAppConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([conversationId, createdAt])
}

model WhatsAppFlow {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId  String   @db.ObjectId
  name        String
  type        String   // "welcome" | "away" | "keyword" | "button_reply"
  isActive    Boolean  @default(true)
  priority    Int      @default(0) // Higher = checked first

  // Trigger config
  trigger     Json
  // {
  //   type: "first_message" | "keyword" | "button_click" | "any_message",
  //   keywords?: string[],         // For keyword triggers
  //   buttonPayload?: string,      // For button reply triggers
  //   businessHoursOnly?: boolean,  // Only fire during business hours
  //   outsideHoursOnly?: boolean,   // Only fire outside business hours
  // }

  // Steps (executed in order)
  steps       Json
  // [
  //   {
  //     type: "send_text",
  //     body: "Welcome to our store!",
  //     delayMs?: 1000
  //   },
  //   {
  //     type: "send_image",
  //     mediaUrl: "https://...",
  //     caption?: "Our storefront"
  //   },
  //   {
  //     type: "send_buttons",
  //     body: "How can we help?",
  //     buttons: [
  //       { id: "order", label: "Order Now" },
  //       { id: "location", label: "Location & Hours" },
  //       { id: "help", label: "Help & Support" }
  //     ]
  //   },
  //   {
  //     type: "send_location",
  //     latitude: 25.xxx,
  //     longitude: 55.xxx,
  //     name: "Our Store",
  //     address: "123 Main St"
  //   },
  //   {
  //     type: "send_url",
  //     body: "Browse our catalog:",
  //     url: "https://waveorder.app/store/viridian"
  //   },
  //   {
  //     type: "notify_team",
  //     message: "Customer needs help",
  //     email?: "team@business.com"
  //   }
  // ]

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([businessId, isActive])
  @@index([businessId, type])
}

model WhatsAppSettings {
  id                    String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId            String   @unique @db.ObjectId
  isEnabled             Boolean  @default(false)
  phoneNumber           String?  // Business WhatsApp number connected
  welcomeFlowEnabled    Boolean  @default(true)
  awayFlowEnabled       Boolean  @default(true)
  businessHoursStart    String?  // "09:00"
  businessHoursEnd      String?  // "22:00"
  businessHoursTimezone String?  // "Asia/Dubai"
  businessDays          Int[]    // [1,2,3,4,5] (Monday=1, Sunday=7)

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 7. Admin UI

### Sidebar Structure

```
Admin Sidebar:
├── Dashboard
├── Orders
├── Products
├── Customers
├── ...
├── WaveOrder Flows        ← NEW (icon: MessageCircle or Zap)
│   ├── Conversations        (inbox view)
│   ├── Flows                (manage automation flows)
│   └── Settings             (phone, hours, enable/disable)
├── Settings
```

### 7.1 Conversations Page

A WhatsApp-style inbox showing all customer conversations.

**Left panel:** Conversation list
- Customer name/phone
- Last message preview (truncated)
- Timestamp
- Unread indicator (dot)
- Search bar at top

**Right panel:** Selected conversation
- Message thread (bubbles — inbound left gray, outbound right teal)
- Auto-reply messages labeled with "Flow" badge
- Reply input at bottom (text + send button)
- Customer info header (phone, first message date, total messages)

### 7.2 Flows Page

List of all flows with ability to create/edit.

**Flow list view:**
- Table: Name, Type (welcome/away/keyword/button), Status (active/inactive toggle), Last triggered, Actions
- "Create Flow" button
- Pre-built template selector: "Welcome", "Away", "FAQ", "Order Redirect"

**Flow editor (form-based, NOT visual canvas):**

```
┌─ Flow Name: [Welcome Flow                    ] ─┐
│                                                    │
│  Trigger                                           │
│  ┌─ Type: [First Message ▾]                     ─┐ │
│  │  ☑ Only outside business hours                 │ │
│  │  Keywords: (not applicable for first message)  │ │
│  └────────────────────────────────────────────────┘ │
│                                                    │
│  Steps (executed in order)                         │
│                                                    │
│  Step 1  [Send Image ▾]                           │
│  ┌─ Image URL: [https://... ▾] or [Upload]      ─┐ │
│  │  Caption: [Welcome to Viridian Bakery!       ] │ │
│  └────────────────────────────────────────────────┘ │
│                                                    │
│  Step 2  [Send Text ▾]                            │
│  ┌─ Message:                                     ─┐ │
│  │  👋 Welcome to Viridian Bakery!                │ │
│  │  ✨ Fresh artisanal breads, pastries...        │ │
│  └────────────────────────────────────────────────┘ │
│                                                    │
│  Step 3  [Send Buttons ▾]                         │
│  ┌─ Body: [How can we help you today?           ]─┐ │
│  │  Button 1: [Order Now          ] ID: [order  ] │ │
│  │  Button 2: [Location & Hours   ] ID: [loc    ] │ │
│  │  Button 3: [Help & Support     ] ID: [help   ] │ │
│  └────────────────────────────────────────────────┘ │
│                                                    │
│  [+ Add Step]                                      │
│                                                    │
│  [Cancel]                          [Save Flow]     │
└────────────────────────────────────────────────────┘
```

### 7.3 Settings Page

- **Enable WaveOrder Flows** toggle
- **WhatsApp Number** (read from business settings, or manual input)
- **Business Hours** (start time, end time, timezone, active days)
- **Webhook URL** display (for Twilio configuration instructions)
- **Connection test** button (send a test message)

---

## 8. Flow Engine Logic

### Message Processing Pipeline

```
Incoming message received via webhook
    │
    ├─ 1. Parse message (text, button_reply, media)
    ├─ 2. Find business by WhatsApp number
    ├─ 3. Find or create conversation
    ├─ 4. Store inbound message
    │
    ├─ 5. Load active flows for business (sorted by priority)
    ├─ 6. For each flow:
    │     ├─ Check trigger conditions:
    │     │   ├─ "first_message" → Is this a new conversation?
    │     │   ├─ "any_message" + outsideHoursOnly → Are we outside hours?
    │     │   ├─ "keyword" → Does message contain keyword?
    │     │   └─ "button_click" → Does buttonPayload match?
    │     │
    │     ├─ If matched → Execute steps in order
    │     │   ├─ send_text → Twilio freeform message
    │     │   ├─ send_image → Twilio message with MediaUrl
    │     │   ├─ send_buttons → Twilio interactive template
    │     │   ├─ send_location → Twilio location template
    │     │   ├─ send_url → Twilio text with URL
    │     │   └─ notify_team → Send email/in-app notification
    │     │
    │     └─ Store outbound messages in DB
    │
    └─ 7. If no flow matched → Mark as unread for manual reply
```

### Business Hours Check

```typescript
function isWithinBusinessHours(settings: WhatsAppSettings): boolean {
  const now = new Date()
  // Convert to business timezone
  const businessTime = convertToTimezone(now, settings.businessHoursTimezone)
  const currentDay = businessTime.getDay() // 0=Sun, 1=Mon...
  const currentTime = format(businessTime, 'HH:mm')

  // Check if current day is a business day
  if (!settings.businessDays.includes(currentDay === 0 ? 7 : currentDay)) {
    return false
  }

  // Check if current time is within hours
  return currentTime >= settings.businessHoursStart
      && currentTime <= settings.businessHoursEnd
}
```

### 24-Hour Window Rule

WhatsApp has a strict rule: businesses can only send **freeform messages** within 24 hours of the customer's last message. Outside this window, only **pre-approved templates** can be sent.

Our flow engine handles this:
- Auto-replies triggered by incoming messages are always within the 24hr window (customer just messaged)
- Manual replies from the inbox must check the 24hr window; show a warning if expired
- Business-initiated messages (broadcasts, proactive outreach) are out of scope (Non-Goal)

---

## 9. Phased Delivery

### Phase 1 — Foundation

**Deliverables:**
- Twilio incoming webhook endpoint (`/api/webhooks/twilio/incoming`)
- Prisma models: `WhatsAppConversation`, `WhatsAppMessage`, `WhatsAppSettings`
- Conversations inbox page (list + thread view + manual reply)
- Admin sidebar entry: "WaveOrder Flows"
- Settings page (enable/disable, phone number, webhook URL display)

**What works after Phase 1:**
- Business can see all incoming WhatsApp messages in admin
- Business can reply to customers from admin
- Conversation history is stored

### Phase 2 — Welcome & Away Messages

**Deliverables:**
- `WhatsAppFlow` Prisma model
- Flow engine (trigger matching + step execution)
- Business hours check logic
- Welcome flow: auto-created per business with default template
- Away flow: auto-created per business with default template
- Settings page: business hours configuration

**What works after Phase 2:**
- Customer messages business → gets welcome message with image + buttons
- Customer messages outside hours → gets away message with hours info
- This matches Viridian's Screenshot 2 and Screenshot 3

### Phase 3 — Custom Flows

**Deliverables:**
- Flows list page (view all, toggle active/inactive)
- Flow editor (form-based, step builder)
- Keyword trigger support
- Button reply trigger support
- Step types: send_text, send_image, send_buttons, send_url, send_location
- Pre-built flow templates (Welcome, Away, FAQ, Order Redirect)
- Notify team action (email notification)

**What works after Phase 3:**
- Full flow automation matching ~90% of Viridian's ChatDaddy setup
- Customer taps "Order Now" → gets catalog link
- Customer taps "Location" → gets map/address
- Customer types "menu" → gets catalog link
- Team gets notified when customer needs human help

### Phase 4 — Polish & Extras

**Deliverables:**
- Unread message count badge in sidebar
- Flow analytics (times triggered, last triggered)
- Template management (view approved templates)
- Media upload for flow steps (images/videos)
- Connection health check
- Mobile-responsive inbox

### Phase 5 — Visual Flow Builder

A drag-and-drop canvas for building flows visually, similar to ChatDaddy's interface.

**Deliverables:**
- React-based visual canvas (using React Flow / `@xyflow/react` library)
- Node types: Trigger, Condition, Message, Buttons, Image, Video, Location, URL, Delay, Notify Team
- Drag nodes from sidebar onto canvas, connect with edges
- Condition node: branch based on keyword match, button clicked, business hours, customer tag
- Live preview panel: shows how the WhatsApp conversation will look
- Import/export flows as JSON (for sharing between businesses or backup)
- Flow versioning: save drafts, publish, rollback
- Pre-built visual templates: Welcome, Away, FAQ Tree, Order Flow, Appointment Booking

**Visual Builder UI:**
```
┌─ Toolbar ──────────────────────────────────────────────────────┐
│  [Save Draft]  [Publish]  [Preview]  [Undo]  [Redo]  [Zoom]   │
├─ Node Panel ──┬─ Canvas ────────────────────────┬─ Properties ─┤
│               │                                  │              │
│  ▪ Trigger    │   ┌──────────┐                  │  Node: Msg   │
│  ▪ Message    │   │ Trigger  │                  │              │
│  ▪ Buttons    │   │ First Msg├──►┌──────────┐   │  Body:       │
│  ▪ Image      │   └──────────┘   │ Welcome  │   │  [Hello!   ] │
│  ▪ Video      │                  │ Message  ├─► │              │
│  ▪ Condition  │                  └──────────┘   │  Media:      │
│  ▪ Delay      │                  ┌──────────┐   │  [Upload   ] │
│  ▪ Location   │              ┌──►│ Order Now│   │              │
│  ▪ URL        │   ┌────────┐ │   └──────────┘   │  Delay:      │
│  ▪ Notify     │   │Buttons ├─┤   ┌──────────┐   │  [1000 ms  ] │
│  ▪ Tag        │   └────────┘ ├──►│ Location │   │              │
│               │              │   └──────────┘   │              │
│               │              │   ┌──────────┐   │              │
│               │              └──►│  Help     │   │              │
│               │                  └──────────┘   │              │
├───────────────┴──────────────────────────────────┴──────────────┤
│  Status: Draft  │  Nodes: 6  │  Last saved: 2 min ago          │
└─────────────────────────────────────────────────────────────────┘
```

**Data model extension:**
```prisma
// Extend WhatsAppFlow model
model WhatsAppFlow {
  // ... existing fields ...

  // Visual builder data
  editorType    String   @default("form") // "form" | "visual"
  canvasData    Json?    // React Flow nodes + edges for visual builder
  // {
  //   nodes: [
  //     { id: "1", type: "trigger", position: { x: 100, y: 50 }, data: { triggerType: "first_message" } },
  //     { id: "2", type: "message", position: { x: 300, y: 50 }, data: { body: "Welcome!" } },
  //     { id: "3", type: "buttons", position: { x: 500, y: 50 }, data: { buttons: [...] } },
  //   ],
  //   edges: [
  //     { source: "1", target: "2" },
  //     { source: "2", target: "3" },
  //   ]
  // }
  version       Int      @default(1)
  publishedAt   DateTime?
  isDraft       Boolean  @default(true)
}
```

### Phase 6 — AI Auto-Replies

AI-powered responses that understand customer intent using the business's product catalog and FAQ data.

**Deliverables:**
- OpenAI / Anthropic integration for intent classification
- Auto-generate replies based on product catalog (prices, availability, descriptions)
- FAQ auto-responder: business uploads FAQ pairs, AI matches incoming questions
- Fallback behavior: AI tries first → if confidence < threshold → route to human
- AI personality settings: tone (formal/casual), language, greeting style
- Conversation context: AI reads last N messages for context, not just the latest
- Cost controls: max AI replies per day per business, token budget
- Admin toggle: enable/disable AI per flow or globally

**AI Pipeline:**
```
Incoming message
    │
    ├─ 1. Check if any manual flow matches (keyword/button) → execute flow
    │
    ├─ 2. If no flow match → AI classification
    │     ├─ Intent: product_inquiry → search catalog → generate response
    │     ├─ Intent: faq_question → match FAQ → generate response
    │     ├─ Intent: order_status → check order DB → generate response
    │     ├─ Intent: complaint → route to human + notify team
    │     └─ Intent: unknown (confidence < 0.6) → route to human
    │
    └─ 3. Store AI response + confidence score in message metadata
```

**Settings UI:**
- Enable AI Auto-Replies (toggle)
- AI Personality: Formal / Friendly / Custom prompt
- Confidence threshold slider (0.5 - 0.9)
- Daily AI reply limit per business
- "Train AI" section: upload FAQ pairs, review AI responses, thumbs up/down feedback

### Phase 7 — Broadcast & Campaigns

Send promotional messages to customer lists using Meta-approved templates.

**Deliverables:**
- Contact list management: import from conversations, CSV upload, manual add
- Customer segments: tags, last order date, total orders, location
- Template builder: create WhatsApp-compliant templates with variables, submit to Meta for approval
- Campaign composer: select segment → select template → preview → schedule or send now
- Campaign analytics: sent, delivered, read, replied, failed
- Opt-out handling: customers can reply "STOP", automatically unsubscribed
- Rate limiting: respect Meta's messaging limits (1,000/day tier 1, scaling up)
- Cost estimation: show estimated Twilio cost before sending

**Campaign UI:**
```
┌─ New Campaign ─────────────────────────────────────────────────┐
│                                                                 │
│  Campaign Name: [Valentine's Day Special              ]         │
│                                                                 │
│  Audience                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Segment: [Customers who ordered in last 30 days  ▾]       ││
│  │  Estimated reach: 142 contacts                              ││
│  │  Excluded: 8 opted-out                                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Template                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [Promotional Offer ▾]  Status: ✅ Approved                ││
│  │                                                              ││
│  │  Preview:                                                    ││
│  │  ┌──────────────────────────────┐                           ││
│  │  │ 🎉 Hi {{1}}!                │                           ││
│  │  │                              │                           ││
│  │  │ Enjoy 20% off this weekend   │                           ││
│  │  │ at {{2}}. Use code: {{3}}    │                           ││
│  │  │                              │                           ││
│  │  │ [Order Now]  [View Menu]     │                           ││
│  │  └──────────────────────────────┘                           ││
│  │                                                              ││
│  │  {{1}} = Customer name                                      ││
│  │  {{2}} = Business name                                      ││
│  │  {{3}} = [VALENTINE20                     ]                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Schedule                                                       │
│  ○ Send now    ● Schedule: [2026-02-14] [10:00 AM] [UTC+4 ▾]  │
│                                                                 │
│  Estimated cost: ~$7.10 (142 messages × $0.05)                 │
│                                                                 │
│  [Cancel]                              [Schedule Campaign]      │
└─────────────────────────────────────────────────────────────────┘
```

**Data models:**
```prisma
model WhatsAppContact {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId    String   @db.ObjectId
  phone         String
  name          String?
  tags          String[]
  optedOut      Boolean  @default(false)
  optedOutAt    DateTime?
  totalOrders   Int      @default(0)
  lastOrderAt   DateTime?
  source        String   @default("conversation") // "conversation" | "import" | "manual"

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([businessId, phone])
  @@index([businessId, optedOut])
  @@index([businessId, tags])
}

model WhatsAppTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId    String   @db.ObjectId
  name          String
  language      String   @default("en")
  category      String   // "MARKETING" | "UTILITY" | "AUTHENTICATION"
  status        String   @default("PENDING") // "PENDING" | "APPROVED" | "REJECTED"
  headerType    String?  // "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"
  headerContent String?
  body          String
  footer        String?
  buttons       Json?    // [{ type: "URL", text: "Order Now", url: "https://..." }]
  variables     Json?    // [{ key: "{{1}}", description: "Customer name", sample: "John" }]
  metaTemplateId String? // Meta's template ID after approval
  rejectionReason String?

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([businessId, status])
}

model WhatsAppCampaign {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId    String   @db.ObjectId
  name          String
  templateId    String   @db.ObjectId
  segmentFilter Json?    // { tags: ["vip"], lastOrderDays: 30 }
  variables     Json     // { "1": "{{contact.name}}", "2": "Viridian Bakery", "3": "VALENTINE20" }
  status        String   @default("draft") // "draft" | "scheduled" | "sending" | "sent" | "failed"
  scheduledAt   DateTime?
  sentAt        DateTime?
  totalRecipients Int    @default(0)
  delivered     Int      @default(0)
  read          Int      @default(0)
  replied       Int      @default(0)
  failed        Int      @default(0)
  estimatedCost Float    @default(0)

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([businessId, status])
  @@index([status, scheduledAt])
}
```

### Phase 8 — Multi-Agent Inbox & Team Collaboration

Shared inbox with assignment, internal notes, and team routing.

**Deliverables:**
- Conversation assignment: assign to specific team member or auto-assign round-robin
- Internal notes on conversations (visible to team only, not sent to customer)
- Conversation status: open → assigned → waiting → resolved
- Agent presence: show who's online, who's handling which conversation
- Canned responses: pre-written reply snippets shared across the team
- SLA timers: warn if conversation has been waiting > X minutes
- Performance metrics per agent: response time, conversations handled, resolution rate
- Supervisor view: see all conversations across all agents

**Data model extensions:**
```prisma
// Extend WhatsAppConversation
model WhatsAppConversation {
  // ... existing fields ...

  assignedTo    String?  @db.ObjectId // User ID of assigned agent
  status        String   @default("open") // "open" | "assigned" | "waiting" | "resolved"
  priority      String   @default("normal") // "low" | "normal" | "high" | "urgent"
  resolvedAt    DateTime?
  firstResponseAt DateTime? // For SLA tracking

  notes WhatsAppNote[]
}

model WhatsAppNote {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  conversationId  String   @db.ObjectId
  authorId        String   @db.ObjectId // User who wrote the note
  body            String
  isInternal      Boolean  @default(true)

  conversation WhatsAppConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([conversationId, createdAt])
}

model WhatsAppCannedResponse {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  businessId  String   @db.ObjectId
  title       String   // Short label: "Greeting", "Out of stock", "Thank you"
  body        String   // Full message text
  shortcut    String?  // Quick type shortcut: "/thanks", "/hours"
  category    String?  // "greeting" | "support" | "order" | "general"

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([businessId])
}
```

---

## 10. Plan Gating

WaveOrder Flows is exclusively available on the **Business plan**. Starter and Pro plans do not have access.

| Feature | Starter | Pro | Business |
|---|---|---|---|
| WaveOrder Flows access | No | No | Yes |
| Conversation inbox | — | — | Yes |
| Welcome & Away messages | — | — | Yes |
| Custom flows (form editor) | — | — | Unlimited |
| Visual flow builder | — | — | Yes |
| AI auto-replies | — | — | Yes |
| Broadcast campaigns | — | — | Yes |
| Multi-agent inbox | — | — | Yes (up to 5 agents) |
| Flow templates | — | — | All |
| Team notifications | — | — | Yes |
| Canned responses | — | — | Unlimited |
| Flow analytics | — | — | Full |
| Campaign analytics | — | — | Full |

---

## 11. API Endpoints

### Webhook

| Method | Path | Description |
|---|---|---|
| POST | `/api/webhooks/twilio/incoming` | Receive incoming WhatsApp messages |

### Admin API — Conversations

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stores/[businessId]/whatsapp-flows/conversations` | List conversations |
| GET | `/api/admin/stores/[businessId]/whatsapp-flows/conversations/[id]` | Get conversation with messages |
| POST | `/api/admin/stores/[businessId]/whatsapp-flows/conversations/[id]/reply` | Send manual reply |
| PATCH | `/api/admin/stores/[businessId]/whatsapp-flows/conversations/[id]` | Mark read/closed/assign |
| POST | `/api/admin/stores/[businessId]/whatsapp-flows/conversations/[id]/notes` | Add internal note |

### Admin API — Flows

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stores/[businessId]/whatsapp-flows/flows` | List flows |
| POST | `/api/admin/stores/[businessId]/whatsapp-flows/flows` | Create flow |
| PUT | `/api/admin/stores/[businessId]/whatsapp-flows/flows/[id]` | Update flow |
| DELETE | `/api/admin/stores/[businessId]/whatsapp-flows/flows/[id]` | Delete flow |
| PATCH | `/api/admin/stores/[businessId]/whatsapp-flows/flows/[id]/toggle` | Toggle active |
| POST | `/api/admin/stores/[businessId]/whatsapp-flows/flows/[id]/publish` | Publish visual flow |

### Admin API — Templates & Campaigns

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stores/[businessId]/whatsapp-flows/templates` | List templates |
| POST | `/api/admin/stores/[businessId]/whatsapp-flows/templates` | Create & submit template |
| DELETE | `/api/admin/stores/[businessId]/whatsapp-flows/templates/[id]` | Delete template |
| GET | `/api/admin/stores/[businessId]/whatsapp-flows/campaigns` | List campaigns |
| POST | `/api/admin/stores/[businessId]/whatsapp-flows/campaigns` | Create campaign |
| POST | `/api/admin/stores/[businessId]/whatsapp-flows/campaigns/[id]/send` | Send/schedule campaign |
| GET | `/api/admin/stores/[businessId]/whatsapp-flows/campaigns/[id]/stats` | Campaign analytics |

### Admin API — Contacts & Settings

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stores/[businessId]/whatsapp-flows/contacts` | List contacts |
| POST | `/api/admin/stores/[businessId]/whatsapp-flows/contacts/import` | Import contacts (CSV) |
| PATCH | `/api/admin/stores/[businessId]/whatsapp-flows/contacts/[id]` | Update contact (tags, opt-out) |
| GET | `/api/admin/stores/[businessId]/whatsapp-flows/settings` | Get settings |
| PUT | `/api/admin/stores/[businessId]/whatsapp-flows/settings` | Update settings |
| POST | `/api/admin/stores/[businessId]/whatsapp-flows/test` | Send test message |
| GET | `/api/admin/stores/[businessId]/whatsapp-flows/canned-responses` | List canned responses |
| POST | `/api/admin/stores/[businessId]/whatsapp-flows/canned-responses` | Create canned response |
| PUT | `/api/admin/stores/[businessId]/whatsapp-flows/canned-responses/[id]` | Update canned response |
| DELETE | `/api/admin/stores/[businessId]/whatsapp-flows/canned-responses/[id]` | Delete canned response |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Twilio webhook setup requires manual config per business | Medium | Provide clear instructions in Settings; consider single shared webhook with business routing |
| WhatsApp 24hr window limits replies | Medium | Show warning in inbox when window expired; guide to use templates |
| Meta template approval delays (1-24hrs) | Low | Pre-approve common templates; provide defaults that work |
| Twilio costs per message (~$0.005-0.05) | Low | Pass through to business or absorb in plan pricing |
| Viridian already on WhatsApp API via ChatDaddy | Medium | Migration guide; can coexist during transition |
| Visual flow builder complexity | High | Use proven library (React Flow); scope to WhatsApp-specific nodes only |
| AI costs (OpenAI/Anthropic per reply) | Medium | Token budgets, daily limits, Business-plan-only gating |
| Meta broadcast rate limits | Medium | Queue system with rate limiting; show estimated delivery time |
| Multi-agent real-time sync | Medium | Use polling initially; upgrade to WebSocket/SSE in v2 |
| Scope creep toward full CRM | High | Strict PRD boundaries; quarterly scope reviews |

---

## 13. Success Metrics

### MVP (Phases 1–4)
- **Adoption:** Business plan customers actively enable and use Flows
- **Engagement:** Consistent automated replies per business per day
- **Retention impact:** Lower churn rate for businesses using Flows vs not
- **Revenue:** Flows cited as reason for upgrading to Business plan
- **ChatDaddy replacement:** Businesses migrate from external WhatsApp tools to Flows

### Full Module (Phases 5–8)
- **Visual builder adoption:** Majority of flow creators prefer visual builder over form editor
- **AI satisfaction:** High accuracy rating on AI auto-replies (thumbs up feedback)
- **Campaign ROI:** Positive return on campaign spend reported by businesses
- **Team efficiency:** Faster response times for businesses using multi-agent inbox
- **Platform stickiness:** Businesses using multiple Flows features show significantly lower churn

---

## 14. Full Sidebar Structure

```
Admin Sidebar:
├── Dashboard
├── Orders
├── Products
├── Customers
├── ...
├── WaveOrder Flows                    ← NEW MODULE
│   ├── Conversations                    (inbox — read/reply/assign)
│   ├── Flows                            (form editor + visual builder)
│   ├── Contacts                         (customer list, tags, segments)
│   ├── Templates                        (WhatsApp message templates)
│   ├── Campaigns                        (broadcast messaging)
│   ├── Canned Responses                 (quick reply snippets)
│   ├── AI Settings                      (auto-reply config, FAQ training)
│   └── Settings                         (phone, hours, team, connection)
├── Settings
```

---

## 15. Phase Summary

| Phase | Scope |
|---|---|
| **Phase 1** | Foundation — webhook, inbox, DB models |
| **Phase 2** | Welcome & Away messages |
| **Phase 3** | Custom Flows (form editor) |
| **Phase 4** | Polish, analytics, media, templates |
| **Phase 5** | Visual Flow Builder |
| **Phase 6** | AI Auto-Replies |
| **Phase 7** | Broadcast & Campaigns |
| **Phase 8** | Multi-Agent Inbox & Team |

**MVP** (Phases 1–4) covers inbox, auto-replies, and custom flows.
**Full module** (Phases 1–8) delivers a complete WhatsApp automation platform.
