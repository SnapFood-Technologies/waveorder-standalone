# AI Store Assistant — Product Requirements Document

**Version:** 1.0
**Date:** February 27, 2026
**Status:** Implemented ✓
**Author:** WaveOrder Engineering

> **Implementation note:** All Phase 1 and Phase 2 items are complete. Additional features implemented: conversation storage for analytics, thumbs up/down feedback, Admin AI Chat Analytics page, SuperAdmin AI Usage page, token usage and cost monitoring, chat widget customization (icon, name, position, size).

---

## 1. Overview

**AI Store Assistant** is a floating chat bubble on the storefront that lets end users ask questions about a business — products, pricing, ordering process, business hours, delivery options, and more. It is powered by OpenAI and uses the business's actual store data as context, so answers are accurate and specific to that store.

The feature is opt-in per business, enabled by SuperAdmin (consistent with how other custom features are managed in WaveOrder).

---

## 2. Problem Statement

End users browsing a WaveOrder storefront currently have no way to get quick answers without:

- Scrolling through the entire catalog to find a specific product
- Messaging the business on WhatsApp and waiting for a reply
- Figuring out delivery options, business hours, or minimum order requirements on their own

Many visitors leave without ordering because they can't find what they need fast enough. A contextual AI assistant that knows the store's products, hours, and policies can answer these questions instantly — reducing drop-off and increasing conversions.

### Business Value

- **Conversion lift:** Visitors who engage with the assistant are more likely to place an order
- **Reduced WhatsApp load:** Common questions (hours, delivery, product availability) are answered automatically
- **Premium feature:** Drives Pro and Business plan upgrades as a high-value differentiator
- **Platform stickiness:** Businesses with AI assistant enabled have a reason to stay on WaveOrder over simpler alternatives

---

## 3. Goals and Non-Goals

### Goals

- ✓ End users see a chat bubble (bottom-left) on storefronts where the feature is enabled
- ✓ End users can ask natural language questions and get instant, accurate answers based on the store's data
- ✓ The AI has full context: products, categories, prices, variants, business hours, delivery options, payment methods, and store policies
- ✓ SuperAdmin can enable/disable the feature per business
- ✓ The assistant uses OpenAI API (GPT) for response generation
- ✓ Conversations stored for analytics (AiChatMessage model); Admin/SuperAdmin dashboards for usage, feedback, token cost
- ✓ The UI matches the storefront's design (uses business primary color, clean bubble style)

### Non-Goals

- Replacing WhatsApp communication between business and customer
- Taking orders through the chat (the assistant directs users to the ordering flow)
- Storing conversation history in the database
- Admin panel for businesses to customize AI responses or train the model
- Multi-language AI responses beyond the store's configured language (future consideration)
- Voice input/output
- Integration with WaveOrder Flows module (separate system)

---

## 4. User Stories

### End User (Customer)

1. **As a customer**, I want to ask "what desserts do you have?" and get a list of dessert products with prices, so I don't have to scroll through the entire menu.

2. **As a customer**, I want to ask "are you open right now?" and get the current status and today's hours, so I know if I can order.

3. **As a customer**, I want to ask "do you deliver to my area?" and understand the delivery radius and fees, so I can decide before ordering.

4. **As a customer**, I want to ask "what's your cheapest option?" and get a quick answer, so I can find something in my budget.

5. **As a customer**, I want to ask "how do I order?" and get a clear step-by-step explanation of the WhatsApp ordering process.

6. **As a customer**, I want to minimize or close the chat bubble if I don't need it, so it doesn't block my browsing.

### SuperAdmin

7. **As a SuperAdmin**, I want to enable the AI assistant for specific businesses, so I can control rollout and costs.

8. **As a SuperAdmin**, I want to see which businesses have the feature enabled, so I can track adoption.

---

## 5. Architecture

### System Flow

```
End user opens storefront
        |
        v
  storeData loaded (products, hours, delivery, etc.)
        |
        v
  Check: aiAssistantEnabled === true?
        |
   No --+-- Yes
   |         |
   v         v
 (hidden)  Show chat bubble (bottom-left)
              |
              v
        User clicks bubble -> chat panel opens
              |
              v
        User types question
              |
              v
    POST /api/storefront/[slug]/ai-chat
              |
              v
    Build system prompt with store context:
      - Business name, description, type
      - All products (name, price, description, category)
      - Business hours + current open/closed status
      - Delivery/pickup options, fees, minimums
      - Payment methods
      - Store language
              |
              v
    Call OpenAI API (gpt-4o-mini)
      - System prompt: store context + behavior rules
      - User messages: conversation history (client-side only)
              |
              v
    Return AI response to client
              |
              v
    Display response in chat panel
```

### OpenAI Integration

**Model:** `gpt-4o-mini` (fast, cheap, sufficient for FAQ-style queries)

**System prompt structure:**
```
You are a helpful assistant for {businessName}, a {businessType} on WaveOrder.
You answer customer questions about the store's products, services, hours, 
delivery options, and ordering process.

STORE INFORMATION:
- Name: {name}
- Description: {description}
- Type: {businessType}
- Currency: {currency}
- Language: {language}

BUSINESS HOURS:
{formatted business hours with current open/closed status}

DELIVERY & ORDERING:
- Delivery: {yes/no}, Fee: {fee}, Minimum: {min}, Free delivery above: {threshold}
- Pickup: {yes/no}
- Estimated delivery time: {time}
- Payment methods: {methods}

PRODUCTS:
{product list with name, price, category, description, variants}

RULES:
- Only answer questions about this store. Politely decline unrelated questions.
- If asked about a product that doesn't exist, say so honestly.
- When mentioning products, include the price.
- If asked how to order, explain the WhatsApp ordering flow.
- Keep answers concise (2-3 sentences unless more detail is requested).
- Respond in {storeLanguage}.
- Never make up information not provided in the store data.
- Do not discuss competitor stores or other businesses.
```

**Token management:**
- System prompt: ~500-2000 tokens depending on catalog size
- Max conversation context sent: last 10 messages
- Max response tokens: 300
- For stores with large catalogs (500+ products), summarize by category instead of listing every product

### Cost Estimation

Using `gpt-4o-mini` pricing:
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens
- Average conversation (5 exchanges): ~3,000 input tokens + 1,500 output tokens = ~$0.001
- 100 conversations/day per business: ~$0.10/day = ~$3/month

---

## 6. Data Model Changes

### Business Model — New Field ✓

```prisma
model Business {
  // ... existing feature flags ...
  aiAssistantEnabled    Boolean  @default(false)
}
```

Single boolean field, consistent with existing feature flag pattern (`brandsFeatureEnabled`, `legalPagesEnabled`, etc.).

### AiChatMessage Model ✓ (added for analytics)

- Stores user/assistant messages, sessionId, feedback (thumbs up/down), tokensUsed, ipAddress, userAgent

---

## 7. API Endpoints

### New Endpoint ✓

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/api/storefront/[slug]/ai-chat` | Send message, get AI response | Public (rate-limited) |
| POST | `/api/storefront/[slug]/ai-chat-feedback` | Submit thumbs up/down on assistant message | Public |

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "What desserts do you have?" },
    { "role": "assistant", "content": "We have..." },
    { "role": "user", "content": "Which one is cheapest?" }
  ]
}
```

**Response:**
```json
{
  "reply": "Our cheapest dessert is the Chocolate Brownie at $4.50.",
  "tokensUsed": 245
}
```

**Guards:**
- Check `aiAssistantEnabled` is true for the business
- Rate limit: 20 requests per minute per IP
- Max 10 messages in conversation context
- Max 500 characters per user message

### Modified Endpoint ✓

| Method | Path | Change |
|---|---|---|
| GET | `/api/storefront/[slug]` | Include `aiAssistantEnabled` in response |

### SuperAdmin Endpoints

Uses the existing feature flags pattern:

| Method | Path | Description |
|---|---|---|
| GET | `/api/superadmin/businesses/[businessId]/custom-features` | Already exists — add `aiAssistantEnabled` |
| PATCH | `/api/superadmin/businesses/[businessId]/custom-features` | Already exists — add `aiAssistantEnabled` |

---

## 8. Storefront UI

### Chat Bubble (Collapsed State)

- **Position:** Fixed, bottom-left corner (`bottom-6 left-5`)
- **Z-index:** 45 (above content, below modals)
- **Shape:** Circular button (56x56px) with chat icon
- **Color:** Uses business `primaryColor` for consistency with store branding
- **Animation:** Subtle pulse on first load to draw attention, then static
- **Mobile:** Same position, slightly smaller (48x48px)
- **Accessibility:** `aria-label="Chat with store assistant"`

### Chat Panel (Expanded State)

```
┌─────────────────────────────────┐
│  AI Assistant        [—] [X]    │  <- Header with minimize/close
├─────────────────────────────────┤
│                                 │
│  👋 Hi! I'm the AI assistant   │  <- Welcome message
│  for {storeName}. Ask me about  │
│  our products, hours, or how    │
│  to order.                      │
│                                 │
│              ┌─────────────────┐│
│              │ What desserts   ││  <- User message (right, primary color)
│              │ do you have?    ││
│              └─────────────────┘│
│                                 │
│  ┌─────────────────┐           │
│  │ We have 3       │           │  <- AI message (left, gray)
│  │ desserts:       │           │
│  │ • Brownie $4.50 │           │
│  │ • Cake $6.00    │           │
│  │ • Ice Cream $3  │           │
│  └─────────────────┘           │
│                                 │
├─────────────────────────────────┤
│  [Type your question...] [Send] │  <- Input + send button
├─────────────────────────────────┤
│  Powered by WaveOrder           │  <- Footer branding
└─────────────────────────────────┘
```

**Panel specs:**
- **Size:** 380px wide x 500px tall (desktop), full-width x 70vh (mobile)
- **Border radius:** `rounded-2xl`
- **Shadow:** `shadow-2xl`
- **Background:** White
- **Messages:** Bubbles — user on right (primary color bg, white text), AI on left (gray-100 bg, gray-900 text)
- **Typing indicator:** Three animated dots when waiting for AI response
- **Scroll:** Auto-scroll to latest message

### Suggested Questions

On first open, show 3-4 clickable suggestion chips below the welcome message:

- "What's on the menu?"
- "Are you open now?"
- "How do I order?"
- "What are the delivery options?"

These adapt based on business type:
- Restaurant/Cafe: "What's on the menu?", "Do you deliver?"
- Retail: "What products do you have?", "What's new?"
- Salon/Services: "What services do you offer?", "How do I book?"

---

## 9. SuperAdmin Management

### Custom Features Page

Add to the existing custom features page at `/superadmin/businesses/[businessId]/custom-features`:

```
┌─────────────────────────────────────────────────────────┐
│  AI Store Assistant                          [Toggle]   │
│  Enable AI-powered chat assistant on the storefront.    │
│  Customers can ask questions about products, hours,     │
│  and ordering. Uses OpenAI API.                         │
│                                                         │
│  Status: Enabled ✓                                      │
└─────────────────────────────────────────────────────────┘
```

Follows the exact same pattern as existing feature toggles (Brands, Collections, Groups, etc.).

---

## 10. Plan Gating

| Feature | Starter | Pro | Business |
|---|---|---|---|
| AI Store Assistant | No | Yes | Yes |

Available on Pro and Business plans — SuperAdmin can enable for eligible businesses.

---

## 11. Implementation Scope

### Phase 1 — Core

- ✓ Add `aiAssistantEnabled` field to Business model in Prisma
- ✓ Add toggle to SuperAdmin custom features page
- ✓ Include `aiAssistantEnabled` in storefront API response
- ✓ Build `POST /api/storefront/[slug]/ai-chat` endpoint with OpenAI integration
- ✓ Build system prompt generator that compiles store data into context
- ✓ Build `AiChatBubble` component (bubble + panel + messages)
- ✓ Add to StoreFront.tsx, SalonStoreFront.tsx, ServicesStoreFront.tsx (conditionally rendered)
- ✓ Rate limiting on the chat endpoint

### Phase 2 — Polish

- ✓ Suggested question chips based on business type
- ✓ Typing indicator animation
- ✓ Mobile-responsive panel (full-width sheet)
- ✓ Token usage tracking per business (for cost monitoring) — `tokensUsed` stored on `AiChatMessage`, aggregated in Admin/SuperAdmin AI usage pages with estimated cost
- ✓ Graceful fallback if OpenAI API is down — API returns 500 with user-friendly error; chat displays "Sorry, something went wrong." or "Sorry, I could not connect. Please try again."
- ✓ "Powered by WaveOrder" footer branding in chat panel

---

## 12. Environment Variables

```env
OPENAI_API_KEY=sk-...          # OpenAI API key (already may exist)
AI_CHAT_MODEL=gpt-4o-mini      # Model to use
AI_CHAT_MAX_TOKENS=300          # Max response tokens
AI_CHAT_RATE_LIMIT=20           # Requests per minute per IP
```

All configuration via environment variables, no hardcoded keys.

---

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| OpenAI API costs scaling with usage | Medium | Use gpt-4o-mini (cheapest); rate limit per IP; Pro/Business plan gating limits exposure |
| AI hallucinating product info | Medium | System prompt explicitly says "never make up information"; only store data is provided as context |
| OpenAI API downtime | Low | Graceful fallback — API returns 500; chat displays user-friendly error message |
| Large catalogs exceeding token limits | Medium | Summarize by category for stores with 500+ products; truncate descriptions |
| Abuse / spam of the endpoint | Medium | Rate limiting (20 req/min per IP); max message length (500 chars); max conversation length (10 messages) |
| User asks inappropriate questions | Low | System prompt restricts to store-related topics; OpenAI content filtering handles the rest |
| Privacy concerns (user messages sent to OpenAI) | Low | No PII collected; conversations are ephemeral; add small disclaimer in chat panel |

---

## 14. Success Metrics

- **Engagement:** Percentage of storefront visitors who interact with the assistant
- **Usefulness:** Conversations that lead to an order within the same session
- **Deflection:** Reduction in basic FAQ-type WhatsApp messages for businesses with assistant enabled
- **Adoption:** Number of Pro and Business plan customers with AI assistant enabled

---

## 15. Future Considerations

Out of scope for this release, but potential additions:

- **Custom FAQ pairs:** Business owner adds Q&A pairs that the AI prioritizes over generated answers
- **Multi-language responses:** AI detects user language and responds accordingly
- ✓ **Conversation analytics:** Admin AI Chat Analytics and SuperAdmin AI Usage pages with messages, feedback, token usage, and cost estimates
- **Product deep links:** AI responses include clickable links to specific products in the catalog
- **Voice input:** Microphone button for voice-to-text questions
- **Integration with WaveOrder Flows:** Hand off complex conversations to the Flows inbox
- **Admin customization:** Business owners can set the AI's tone, greeting message, and restricted topics
