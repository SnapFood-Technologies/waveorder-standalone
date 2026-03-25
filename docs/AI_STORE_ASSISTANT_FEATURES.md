# AI Store Assistant — features (for stores)

Floating chat on the **business storefront** so customers can ask questions in plain language. Answers use **that store’s live data** (catalog, hours, delivery, etc.), powered by OpenAI. SuperAdmin turns the feature on per business; it is intended for **Pro / Business** plans unless overridden.

---

## What customers get (storefront)

| Feature | Description |
|--------|----------------|
| **Chat bubble** | Fixed corner button (store primary color); opens a chat panel. |
| **Natural-language Q&A** | Ask about products/services, prices, categories, hours, open/closed now, delivery areas and fees, pickup, payment methods, how to order or book (wording follows store setup). |
| **Store-aware context** | The model receives compiled store data (name, type, currency, language, hours, closures, delivery/pickup/dine-in flags, fees, minimums, zones/city pricing where configured, products/services with prices, appointment-related flags when applicable). |
| **Suggested prompts** | Chips on first open (vary by business type, e.g. menu, hours, how to order). |
| **Language handling** | Assistant follows store language rules in the system prompt (including clarifying user vs store language when they differ on first message). |
| **Safety rules** | Scoped to **this store only**; no invented products/prices; content moderation on user input; polite decline for off-topic or abusive use. |
| **Feedback** | Customers can rate assistant replies (thumbs up / down) where implemented. |
| **Limits** | Rate limit per IP; max message length; bounded conversation context — reduces abuse and cost. |

---

## What the assistant does **not** do

- **Does not** place orders or take payment inside chat (it guides customers toward your normal ordering flow).
- **Does not** replace WhatsApp or direct contact — it reduces repetitive FAQ load.
- **Does not** persist full chat history for the shopper in the database as a long-term account (messages can be stored server-side for **analytics** — see below).
- **Does not** include business-custom training UI or custom FAQ editor in admin (future consideration in PRD).

---

## What store admins get (when the feature is enabled)

| Feature | Description |
|--------|----------------|
| **AI Chat admin page** | View conversations (by session), summaries, top questions, thumbs up/down counts, token usage where exposed. |
| **Widget branding** | Set assistant **display name**, **icon** (e.g. message / help / robot), **icon size**, **bubble position** (left or right corner). |

---

## What SuperAdmin / platform controls

| Feature | Description |
|--------|----------------|
| **Enable per business** | Toggle on Custom Features (and plan eligibility as per product rules). |
| **Model override** | Optional per-business model setting where supported (e.g. default vs upgraded model). |
| **Usage & cost visibility** | SuperAdmin views for AI usage / token estimates for monitoring. |

---

## Technical notes (summary)

- **API:** Storefront posts to the store’s AI chat endpoint; OpenAI generates replies from the built system prompt + messages.
- **Model:** Typically `gpt-4o-mini` (configurable via environment / overrides).
- **Analytics:** Messages can be stored for analytics (e.g. `AiChatMessage` with session id, feedback, tokens).
