/**
 * Translations for auto-created default WhatsApp flows (welcome, away).
 * Uses same languages as storefront: en, sq/al, es, el/gr.
 */

export interface DefaultFlowTranslations {
  welcomeMessage: (businessName: string) => string
  orderNow: string
  awayMessage: (start: string, end: string, timezone: string) => string
  localTime: string
}

const en: DefaultFlowTranslations = {
  welcomeMessage: (name) =>
    `👋 Welcome to ${name}!\n\nBrowse our catalog and place your order easily.`,
  orderNow: 'Order now:',
  awayMessage: (start, end, tz) =>
    `Hi! Thanks for your message. We're currently closed. Our hours are ${start}–${end} (${tz}). We'll reply as soon as we're back!`,
  localTime: 'local time',
}

const sq: DefaultFlowTranslations = {
  welcomeMessage: (name) =>
    `👋 Mirë se erdhet te ${name}!\n\nShfleto katalogun tonë dhe porosit lehtësisht.`,
  orderNow: 'Porosit tani:',
  awayMessage: (start, end, tz) =>
    `Përshëndetje! Faleminderit për mesazhin tuaj. Aktualisht jemi të mbyllur. Oret tona janë ${start}–${end} (${tz}). Do të përgjigjemi sa më shpejt të jemi përsëri!`,
  localTime: 'ora lokale',
}

const es: DefaultFlowTranslations = {
  welcomeMessage: (name) =>
    `👋 ¡Bienvenido a ${name}!\n\nExplora nuestro catálogo y haz tu pedido fácilmente.`,
  orderNow: 'Pedir ahora:',
  awayMessage: (start, end, tz) =>
    `¡Hola! Gracias por tu mensaje. Estamos cerrados en este momento. Nuestro horario es ${start}–${end} (${tz}). ¡Te responderemos en cuanto volvamos!`,
  localTime: 'hora local',
}

const el: DefaultFlowTranslations = {
  welcomeMessage: (name) =>
    `👋 Καλώς ήρθατε στο ${name}!\n\nΠεριηγηθείτε στον κατάλογό μας και κάντε την παραγγελία σας εύκολα.`,
  orderNow: 'Παραγγελία τώρα:',
  awayMessage: (start, end, tz) =>
    `Γεια σας! Ευχαριστούμε για το μήνυμά σας. Είμαστε προσωρινά κλειστά. Οι ώρες λειτουργίας μας είναι ${start}–${end} (${tz}). Θα απαντήσουμε μόλις επιστρέψουμε!`,
  localTime: 'τοπική ώρα',
}

export function getDefaultFlowTranslations(
  language: string
): DefaultFlowTranslations {
  if (language === 'sq' || language === 'al') return sq
  if (language === 'es') return es
  if (language === 'el' || language === 'gr') return el
  return en
}
