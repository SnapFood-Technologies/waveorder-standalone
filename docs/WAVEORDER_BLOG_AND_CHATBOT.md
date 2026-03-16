# WaveOrder – Blog & Chatbot Features

Two features for waveorder.app: Blog and Chatbot.

---

## Feature 1: Blog

### Purpose

- SEO content (how-to, use cases, industry guides)
- Thought leadership and trust
- Long-tail keywords for discovery

### Scope

- Blog listing page (e.g. `/blog`)
- Blog post pages (e.g. `/blog/[slug]`)
- CMS or markdown-based content
- Categories/tags
- SEO metadata per post
- Optional: RSS feed

### Technical Options

- **Markdown files** – Simple, version-controlled
- **Headless CMS** (Sanity, Contentful) – Non-dev editing
- **Database** – `BlogPost` model in Prisma
- **MDX** – Markdown + React components

---

## Feature 2: Chatbot

### Purpose

- Answer questions on waveorder.app (pricing, features, setup)
- Capture leads (visitor asks → qualify → add to CRM)
- Reduce contact form friction

### Scope

- Widget on site (floating button, slide-out panel)
- AI-powered responses (or rule-based)
- Lead capture: "Interested in a demo? Leave your email."
- Optional: handoff to human / contact form

### Integration with Omni Agent

- **Chatbot requests** → Webhook to Omni Agent
- Omni Agent: classify intent, create/update lead, optionally reply
- Same as contact form but from chat

### Events for Omni Agent

| Event | When | Payload |
|-------|------|---------|
| `chatbot_message` | User sends a message in chatbot | `{ sessionId, message, email?, name?, intent? }` |
| `chatbot_lead_capture` | User provides email in chat (e.g. "I want a demo") | `{ sessionId, email, name?, message, source: 'chatbot' }` |

---

## Omni Agent – Lead Sources

| Source | Event | Agent |
|--------|-------|-------|
| Contact form | `contact_submitted` | Contact Agent |
| Chatbot | `chatbot_lead_capture` | Contact Agent |
| Onboarding abandoned | `onboarding_abandoned` | Contact Agent |

All flow to Contact Agent for lead creation, intent classification, and follow-up.
