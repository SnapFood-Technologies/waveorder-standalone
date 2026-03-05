# WaveOrder Flows — Technical Feature Documentation

**Version:** 1.0  
**Date:** March 2026  
**Purpose:** Document all WaveOrder Flows features from a technical perspective (no schema/DB details)

---

## Admin Features

### 1. Conversations (Inbox)

| Feature | Description |
|---------|-------------|
| **Conversation list** | Left panel showing all customer conversations with search, last message preview, timestamp, unread indicator |
| **Message thread** | Right panel with message bubbles (inbound gray, outbound teal), flow replies labeled with "Flow" badge |
| **Manual reply** | Text input to send replies to customers; respects 24-hour messaging window |
| **Mark as read** | Viewing a conversation marks it as read; unread count updates in sidebar |
| **Assign to agent** | Dropdown to assign conversations to team members |
| **Status management** | Set status: open, assigned, waiting, resolved, closed |
| **Internal notes** | Collapsible notes per conversation; visible to team only |
| **Canned responses** | Pre-written snippets; quick-insert buttons in reply area |
| **Supervisor view** | Filter tabs: All \| Mine \| Unassigned |
| **Agent presence** | Green dot (●) in assign dropdown for online agents (5-min heartbeat) |
| **Auto-assign** | Round-robin assignment of new conversations when enabled; manual "Auto-assign" button |
| **SLA badge** | Red "SLA" badge when customer wait exceeds configured threshold (default 15 min) |
| **Agent metrics toggle** | Per-agent stats: assigned, resolved, resolution %, avg first-response time |
| **Mobile-responsive** | On small screens, thread full-width with back button; list hidden when thread visible |

### 2. Flows

| Feature | Description |
|---------|-------------|
| **Flow list** | Table: Name, Type, Status (active/inactive toggle), Triggered count, Last triggered, Edit/Delete |
| **Create Flow** | Button to create new flow; pre-built template selector by business type |
| **Form-based editor** | Modal with flow name, trigger type, keywords/button payload, business hours options, step builder |
| **Visual Flow Builder** | Drag-and-drop canvas with nodes: Trigger, Message, Image, URL, Location, Notify, Delay, Condition |
| **Step types** | send_text, send_image, send_url, send_location, notify_team |
| **Trigger types** | first_message, keyword, button_click, any_message |
| **Business hours** | Trigger options: during hours only, outside hours only |
| **Pre-built templates** | Business-type-specific: Welcome, Away, FAQ (Menu/Catalog/Book/Quote), Order/Booking/Request Redirect, Location, Daily Specials, Promotions, etc. |
| **Template info modal** | Per-template CTA: description + use cases for business type |
| **Use cases modal** | "Use cases for your business" CTA showing adoption examples by business type |
| **Media upload** | Upload button for send_image steps; images stored in flows folder |
| **Guide modal** | Visual builder help overlay |

### 3. Broadcast

| Feature | Description |
|---------|-------------|
| **Contacts tab** | Import from Conversations, Import from CSV (phone, name), Sync Order/Booking/Request Stats |
| **CSV import** | Accepts columns: phone (or Phone, tel), name (optional); Download example CSV link |
| **Contact list** | Table: Phone, Name, Orders/Bookings/Requests (by business type), Status (Subscribed/Opted out) |
| **Templates tab** | Add Meta-approved templates (name, Content SID, body preview, variable count); CTA to contact WaveOrder support |
| **Campaigns tab** | Create campaigns: name, template, segment (tags, last N days), variable mapping |
| **Campaign modal** | Segment by tags (comma-separated) or activity in last N days; estimated reach, excluded opted-out; Save as Draft or Send Now |
| **Variable interpolation** | {{1}}, {{2}}… mapped to contact name, phone, or custom; {{contact.name}}, {{contact.phone}} |
| **Informative section** | Collapsible "How Broadcast works" with contacts, campaigns, pricing note |
| **Terminology by business type** | Orders (restaurant/retail), Bookings (salon), Requests (services) |

### 4. Settings

| Feature | Description |
|---------|-------------|
| **Enable/disable** | Toggle WaveOrder Flows for the business |
| **WhatsApp number** | Display and configure phone for webhook routing |
| **Webhook URL** | Display and copy for provider configuration |
| **Connection test** | Send test message to verify credentials |
| **Business hours** | Start time, end time, timezone, active days |
| **Welcome/Away toggles** | Enable or disable default welcome and away flows |
| **AI Auto-Replies** | Toggle, personality (formal/friendly/custom), confidence threshold, daily limit |
| **FAQ training** | CRUD for FAQ pairs used by AI for intent matching |
| **Canned responses** | CRUD for quick-reply snippets (title, body, shortcut) |
| **Multi-agent** | Agent selection (team members), auto-assign toggle, SLA warning minutes |

---

## SuperAdmin Features

### 1. System → WaveOrder Flows Overview

| Feature | Description |
|---------|-------------|
| **Global metrics** | Flows enabled count, adoption rate (% of BUSINESS plan), total conversations, messages in period |
| **Period selector** | Today, Last 7 days, This month, All time |
| **Top businesses** | Table of businesses by conversation count; link to per-business usage |
| **Quick links** | Twilio & Flows Activities, All Businesses |

### 2. Businesses → [Business] → WaveOrder Flows

| Feature | Description |
|---------|-------------|
| **Enable/disable toggle** | SuperAdmin can enable or disable Flows for a business |
| **Usage page** | Per-business metrics: conversations (period/all time), inbound/outbound messages, flow replies, AI replies, broadcasts sent/delivered/failed, unread count |
| **Period selector** | Today, Last 7 days, This month, All time |
| **Quick links** | Twilio & Flows Activities (filtered by business), Open Inbox (Admin) |

### 3. Business Details Page

| Feature | Description |
|---------|-------------|
| **Flows status badge** | Shows Enabled/Disabled with toggle |
| **Link to usage** | Navigate to per-business Flows usage page |
| **Adoption messaging** | When disabled: suggest enabling for welcome, away, keyword flows |

---

## Flow Engine (Backend)

| Feature | Description |
|---------|-------------|
| **Incoming webhook** | Receives messages from provider; finds business by phone; creates/updates conversation |
| **Trigger matching** | first_message, keyword, button_click, any_message; business hours check |
| **Step execution** | send_text, send_image, send_url, send_location, notify_team; rate limiting |
| **AI fallback** | When no flow matches and AI enabled: intent classification, FAQ/order context, response generation |
| **Opt-out handling** | Detects STOP, UNSUBSCRIBE, etc.; marks contact opted out |
| **Campaign sender** | Sends template messages to segment; variable interpolation; rate limit (~5 msg/sec) |

---

## Plan Gating

- WaveOrder Flows is **Business plan only**. Starter and Pro plans see upgrade prompt when accessing Flows pages.
