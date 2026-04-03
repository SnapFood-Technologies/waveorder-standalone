# WaveOrder — short FAQ (chatbot grounding)

Re-verify pricing at [waveorder.app/pricing](https://waveorder.app/pricing) before quoting in production.

- **Support:** [support@waveorder.app](mailto:support@waveorder.app)
- **Site:** [waveorder.app](https://waveorder.app)

## Chatbot voice

Say **WaveOrder** or **waveorder.app** to users. Do **not** say “marketing site” in replies — that phrase is only for internal docs (it means the public site at waveorder.app: home, pricing, sign-up, legal pages). Sign-up and the dashboard are both WaveOrder; the URL for getting started is waveorder.app.

---

## FAQ

### What is WaveOrder?

WaveOrder helps businesses sell through a web catalog and take orders on WhatsApp. Customers browse your link, build an order, and open WhatsApp with a pre-filled message to your number. You do not need the WhatsApp Business API for that basic flow.

### How do I register or sign up?

Go to [https://waveorder.app](https://waveorder.app) and sign up (register). Then complete the business setup wizard, add your catalog (manually or CSV on typical product plans), connect your WhatsApp number, and share your store link.

### How much does WaveOrder cost?

Plans in the product are in USD: Starter about $19/mo ($16/mo if billed yearly), Pro about $39/mo ($32/mo yearly), Business about $79/mo ($66/mo yearly). Annual saves about 17%. Always confirm current numbers on [waveorder.app/pricing](https://waveorder.app/pricing).

### Is there a free trial?

WaveOrder offers a 14-day trial with access to that plan’s features. Docs say no credit card required to start — confirm in the live signup flow if the user needs certainty.

### Do I need the WhatsApp Business API?

No for the standard flow. Regular WhatsApp or the WhatsApp Business app works. Orders go to your existing number without API setup or per-message fees for that core path.

### How do customers pay?

In the product today, merchants configure cash for customer orders (e.g. on delivery, pickup, or when a service is completed — wording depends on business type). Card/PayPal/bank for buyers are not enabled in the merchant setup UI yet; those appear as coming soon. Merchants pay their WaveOrder subscription separately via Stripe (cards, etc.) — that is not the same as customer checkout.

### Does WaveOrder take a cut of my sales?

Positioning is no commission on your orders; you pay the subscription. For legal certainty, point users to Terms or support.

### What business types does WaveOrder support?

Restaurant, cafe, retail, grocery, salon, professional services (appointments and requests), and other. Salon/services flows use booking/session language; product businesses use products and CSV import where applicable.

### Can I use WaveOrder with Instagram / link in bio?

Yes. Put your catalog link in bio, stories, or posts; customers order through WhatsApp.

### Can I have more than one store?

Starter includes one catalog/store. Pro includes up to five. Business includes unlimited. Each store can have its own link, branding, and WhatsApp number.

### What is on the Business plan that Pro does not have?

Unlimited stores, team access (about five users in code), custom domain, API access, dedicated support wording. Pro has no custom domain and no API access in plan limits.

### How fast can I go live?

WaveOrder’s materials say many businesses are live in about five minutes after signup — treat as typical, not a guarantee.

### Is there a demo?

Yes — try the demo on [waveorder.app](https://waveorder.app) (e.g. `/demo`) before signing up.

### Where is API documentation?

Point developers to [waveorder.app/developers](https://waveorder.app/developers) and API docs (e.g. `/api-docs`). Do not invent endpoints.

### Who do I contact for help?

[support@waveorder.app](mailto:support@waveorder.app). For legal, privacy, or subscription refunds, use Terms and Privacy on waveorder.app or support — do not invent policies.

### Can the chatbot access my WaveOrder account?

No. For dashboard or billing issues, sign in to WaveOrder or email support.
