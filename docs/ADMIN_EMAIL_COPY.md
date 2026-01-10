# Admin Email Copy - English & Albanian

This document contains all admin/business owner-facing email copy used in system notifications, organized by email type.

**Last Updated**: January 10, 2026

**Important Note**: Only **Order Notifications** are localized (English, Albanian, Spanish). All other admin emails (Low Stock Alerts, Team Management, Support emails, Account emails) are **English only** and not translated.

---

## Email Types

1. [Order Notifications](#order-notifications) - **Localized (English, Albanian, Spanish)**
2. [Low Stock Alerts](#low-stock-alerts) - **English only**
3. [Team Management](#team-management) - **English only**
   - Team Invitation
   - Team Member Removed
   - Role Changed
4. [Support & Communication](#support--communication) - **English only**
   - Support Ticket Updated
   - Support Ticket Comment
   - Support Message Received
5. [Account & Subscription](#account--subscription) - **English only**
   - Business Created
   - Subscription Change
   - Payment Failed
   - Email Change Verification

---

## Order Notifications

Sent to business owners when orders are received or updated (if enabled in Settings → Notifications).

### Subject Lines

#### New Order
| Language | Subject Format |
|----------|---------------|
| English | New Order: {OrderNumber} - {BusinessName} |
| Albanian | Porosi e Re: {OrderNumber} - {BusinessName} |
| Spanish | Nuevo Pedido: {OrderNumber} - {BusinessName} |

#### Order Update
| Language | Subject Format |
|----------|---------------|
| English | Order Update: {OrderNumber} - {Status} |
| Albanian | Përditësim i Porosisë: {OrderNumber} - {Status} |
| Spanish | Actualización de Pedido: {OrderNumber} - {Status} |

### Email Content

#### Header (New Order)

| Language | Text |
|----------|------|
| English | New Order Received! |
| Albanian | Porosi e Re e Marrë! |
| Spanish | ¡Nuevo Pedido Recibido! |

#### Header (Order Update)

| Language | Text |
|----------|------|
| English | Order Update |
| Albanian | Përditësim i Porosisë |
| Spanish | Actualización de Pedido |

#### New Order Badge

| Language | Text |
|----------|------|
| English | New |
| Albanian | E Re |
| Spanish | Nuevo |

#### Order Section Labels

| Element | English | Albanian | Spanish |
|---------|---------|----------|---------|
| Order | Order | Porosi | Pedido |
| Order Items | Order Items | Artikujt e Porosisë | Artículos del Pedido |
| Customer Information | Customer Information | Informacioni i Klientit | Información del Cliente |
| Name | Name | Emri | Nombre |
| Phone | Phone | Telefoni | Teléfono |
| Delivery Address | Delivery Address | Adresa e Dorëzimit | Dirección de Entrega |
| Delivery Method | Delivery Method | Metoda e Dorëzimit | Método de Entrega |
| Postal Service | Postal Service | Shërbimi Postar | Servicio Postal |
| Delivery Time | Delivery Time | Koha e Dorëzimit | Tiempo de Entrega |
| Delivery Fee | Delivery Fee | Tarifa e Dorëzimit | Tarifa de Entrega |
| City | City | Qyteti | Ciudad |
| Country | Country | Shteti | País |
| Postal Code | Postal Code | Kodi Postar | Código Postal |
| Variant | Variant | Varianti | Variante |
| Special Instructions | Special Instructions | Udhëzime të Veçanta | Instrucciones Especiales |
| View Order Details | View Order Details | Shiko Detajet e Porosisë | Ver Detalles del Pedido |

#### Order Status Labels

| Status | English | Albanian | Spanish |
|--------|---------|----------|---------|
| Pending | Pending | Në Pritje | Pendiente |
| Confirmed | Confirmed | E Konfirmuar | Confirmado |
| Preparing | Preparing | Duke U Përgatitur | Preparando |
| Ready | Ready | Gati | Listo |
| Picked Up | Picked Up | Marrë | Recogido |
| Out for Delivery | Out for Delivery | Në Rrugë | En Camino |
| Delivered | Delivered | Dorëzuar | Entregado |
| Cancelled | Cancelled | Anuluar | Cancelado |
| Refunded | Refunded | Rimbursuar | Reembolsado |

#### Order Type Labels

**For RESTAURANT businesses:**
| Type | English | Albanian | Spanish |
|------|---------|----------|---------|
| Delivery | Delivery Order | Porosi Dorëzimi | Pedido de Entrega |
| Pickup | Pickup Order | Porosi Marrjeje | Pedido para Recoger |
| Dine-in | Dine-in Order | Porosi Në Vend | Pedido en el Local |

**For RETAIL businesses:**
| Type | English | Albanian | Spanish |
|------|---------|----------|---------|
| Delivery | Shipping Order | Porosi Dërgimi | Pedido de Envío |
| Pickup | Store Pickup | Marrje Në Dyqan | Recogida en Tienda |
| Dine-in | In-Store Order | Porosi Në Dyqan | Pedido en Tienda |

#### Status Update Message

| Language | Text |
|----------|------|
| English | Order status has been updated |
| Albanian | Statusi i porosisë është përditësuar |
| Spanish | El estado del pedido ha sido actualizado |

#### Footer

| Element | English | Albanian | Spanish |
|---------|---------|----------|---------|
| Notification enabled message | This notification was sent because you have order notifications enabled. | Kjo njoftim u dërgua sepse keni aktivizuar njoftimet e porosive. | Esta notificación se envió porque tienes las notificaciones de pedidos habilitadas. |
| Manage settings link | Manage notification settings | Menaxho cilësimet e njoftimeve | Gestionar configuración de notificaciones |

---

## Low Stock Alerts

**Language Support**: English only (not localized)

Sent to business owners when products fall below configured low stock thresholds.

### Subject Line

| Subject Format |
|---------------|
| ⚠️ Low Stock Alert - {X} Product(s) Running Low |

### Email Content

#### Header

| Text |
|------|
| Low Stock Alert ⚠️ |

#### Main Message

| Text |
|------|
| Hello {OwnerName},<br><br>You have **{X} product(s)** that {are/is} running low on stock and require{/s} your attention. |

#### Table Headers

| Header | Text |
|--------|------|
| Product | Product |
| Status | Status |
| Stock | Stock |

#### Status Labels

| Status | Text |
|--------|------|
| OUT OF STOCK | OUT OF STOCK |
| CRITICAL | CRITICAL |
| LOW | LOW |

#### Action Buttons

| Button | Text |
|--------|------|
| Adjust Stock Levels | Adjust Stock Levels |
| View All Products | View All Products |

#### Tip Section

| Text |
|------|
| **💡 Tip:** You can configure low stock alerts for each product individually in your product settings. Disable notifications for specific products if you don't need alerts. |

#### Footer

| Text |
|------|
| This is an automated alert from WaveOrder<br><br>To manage email notifications, visit your [product settings]({Link}) |

---

## Team Management

**Language Support**: English only (not localized)

### Team Invitation

Sent to team members when they're invited to join a business.

#### Subject Line

| Subject Format |
|---------------|
| You're invited to join {BusinessName} on WaveOrder |

#### Email Content

**Header:**

| Text |
|------|
| You're Invited to Join {BusinessName} |

**Main Message:**

| Text |
|------|
| {InviterName} has invited you to join their WaveOrder team as a **{Role}**. You'll be able to help manage orders, products, and customer interactions. |

**Role Descriptions:**

**MANAGER:**
- "As a manager, you'll have access to manage orders, menu items, settings, and can invite other team members."

**STAFF:**
- "As a staff member, you'll be able to view and manage orders to help serve customers efficiently."

**Action Button:**

| Text |
|------|
| Accept Invitation |

**Invitation Expiry:**

| Text |
|------|
| 📅 Invitation Expires<br><br>This invitation will expire in 7 days. If you don't have a WaveOrder account, one will be created for you when you accept. |

### Team Member Removed

Sent to team members when their access is removed.

#### Subject Line

| Subject Format |
|---------------|
| Access removed from {BusinessName} |

#### Email Content

**Header:**

| Text |
|------|
| Access Removed |

**Main Message:**

| Text |
|------|
| Hi {Name},<br><br>Your access to **{BusinessName}** has been removed by {RemovedBy}. |

**What This Means:**

| Text |
|------|
| **What this means:**<br>• You no longer have access to the business dashboard<br>• You cannot view or manage orders, products, or settings<br>• All your previous permissions have been revoked |

**Action Button:**

| Text |
|------|
| Contact Support |

**Footer:**

| Text |
|------|
| Thank you for your time with {BusinessName}.<br><br>**WaveOrder Team** |

### Role Changed

Sent to team members when their role is updated.

#### Subject Line

| Subject Format |
|---------------|
| Role updated in {BusinessName} - You are now {NewRole} |

#### Email Content

**Header:**

| Text |
|------|
| Role Updated |

**Main Message:**

| Text |
|------|
| Hi {Name},<br><br>Your role in **{BusinessName}** has been updated by {ChangedBy}. |

**New Permissions (OWNER):**
- "Full access to all features, can manage team and billing"

**New Permissions (MANAGER):**
- "Can manage products, orders, and invite staff members"

**New Permissions (STAFF):**
- "Can view and manage orders and products"

**Upgrade Message:**

| Text |
|------|
| 🎉 **Congratulations!** Your role has been upgraded. You now have access to additional features and permissions. |

**Action Button:**

| Text |
|------|
| Access Dashboard |

**Footer:**

| Text |
|------|
| Questions about your new role? Contact {ChangedBy} or our support team.<br><br>**WaveOrder Team** |

---

## Support & Communication

**Language Support**: English only (not localized)

### Support Ticket Updated

Sent to business admin when SuperAdmin updates ticket status.

#### Subject Line

| Subject Format |
|---------------|
| Ticket #{TicketNumber} Updated - {Status} |

#### Email Content

**Header:**

| Text |
|------|
| Ticket Updated |

**Main Message:**

| Text |
|------|
| Your support ticket has been updated. |

**Action Button:**

| Text |
|------|
| View Ticket |

**Footer:**

| Text |
|------|
| Thank you for using WaveOrder support. We're here to help!<br><br>**WaveOrder Support Team** |

### Support Ticket Comment

Sent to business admin when a comment is added to their support ticket.

#### Subject Line

| Subject Format |
|---------------|
| New Comment on Ticket #{TicketNumber} |

**Action Button:**

| Text |
|------|
| View Ticket & Reply |

### Support Message Received

Sent to business admin when SuperAdmin sends a support message.

#### Subject Line

| Subject Format |
|---------------|
| New Message: {Subject} |

**Action Button:**

| Text |
|------|
| Reply to Message |

---

## Account & Subscription

**Language Support**: English only (not localized)

### Business Created

Sent to business owner when account is created.

#### Subject Line

| Subject Format |
|---------------|
| Welcome to WaveOrder {PRO emoji if PRO} - Your business "{BusinessName}" is ready! |

### Subscription Change

#### Upgrade Subject

| Subject |
|---------|
| 🎉 Welcome to WaveOrder PRO! |

#### Downgrade Subject

| Subject |
|---------|
| Your WaveOrder Subscription Has Changed |

#### Cancellation Subject

| Subject |
|---------|
| Your WaveOrder PRO Subscription Has Been Canceled |

#### Renewal Subject

| Subject |
|---------|
| ✅ Your WaveOrder PRO Subscription Has Been Renewed |

### Payment Failed

#### Subject Line

| Subject |
|---------|
| ⚠️ Payment Failed - Action Required for WaveOrder PRO |

### Email Change Verification

#### Subject Line

| Subject |
|---------|
| Verify Your New Email Address - WaveOrder |

---

## Email Template Structure

Admin emails generally include:

1. **Header** - Gradient header with business/platform branding
2. **Main Content** - Context-specific information
3. **Action Buttons/Links** - CTA buttons when applicable
4. **Footer** - Automated notification disclaimer and support contact
5. **Copyright** - © 2026 Electral Shpk. All rights reserved.

---

## Notes

### Localization Status

- **Order Notifications**: Fully localized (English, Albanian, Spanish) based on `business.language` setting
- **All Other Admin Emails**: English only (not localized)
  - Low Stock Alerts
  - Team Management emails (Invitation, Removed, Role Changed)
  - Support & Communication emails
  - Account & Subscription emails

### Configuration

- Order notifications are configurable per business in Settings → Notifications
- Low stock alerts are configurable per product
- Support message notifications are configurable in support settings
- Language is determined by `business.language` field (only applies to Order Notifications)
- Country names in addresses are localized based on business language (Order Notifications only)
- Postal service names are localized for RETAIL businesses (Order Notifications only)

---

*This document reflects the current implementation as of January 10, 2026.*
