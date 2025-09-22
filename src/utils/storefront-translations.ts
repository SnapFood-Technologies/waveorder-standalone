// src/utils/storefront-translations.ts

export interface StorefrontTranslations {
    // Navigation & Search
    search: string
    allCategories: string
    all: string
    
    // Status
    open: string
    closed: string
    
    // General
    welcome: string
    deliveryIn: string
    customize: string
    add: string
    outOfStock: string
    onlyLeft: string
    left: string
    
    // Order Details
    orderDetails: string
    delivery: string
    pickup: string
    dineIn: string
    
    // Form Fields
    name: string
    whatsappNumber: string
    email: string
    addressLine1: string
    addressLine2: string
    deliveryTime: string
    pickupTime: string
    arrivalTime: string
    asap: string
    mins: string
    
    // Cart & Checkout
    cartItems: string
    subtotal: string
    deliveryFee: string
    total: string
    minimumOrder: string
    forDelivery: string
    moreTo: string
    specialInstructions: string
    anySpecialRequests: string
    orderViaWhatsapp: string
    placingOrder: string
    clickingButton: string
    yourOrder: string
    
    // Product Modal
    chooseSize: string
    addExtras: string
    required: string
    quantity: string
    addToCart: string
    
    // Placeholders
    streetAddress: string
    apartment: string
    
    // Footer
    poweredBy: string
    
    // Empty States
    noProductsFound: string
    noProductsFoundDescription: string
    noProductsInCategory: string
    noProductsInCategoryDescription: string
    tryDifferentSearch: string
    browseAllProducts: string
    comingSoon: string
    checkBackLater: string

    now: string
    schedule: string
    selectDate: string
    selectTime: string
    today: string
    tomorrow: string
    noTimeSlots: string
    address: string
    pickupLocation: string
    directions: string
    tapForDirections: string
    pickupInstructions: string
    mapView: string
    businessInfo: string
    about: string
    contact: string
    hours: string
    serviceOptions: string
    share: string
    copyLink: string
    shareVia: string
    temporarilyClosed: string
    expectedReopen: string
    storeTemporarilyClosed: string
    storeClosedMessage: string
    time: string
    serviceFee: string
    popular: string
    freeDelivery: string
    pickupAvailable: string

    maintenanceMessage: string
    holidayMessage: string
    emergencyMessage: string
    staffShortageMessage: string
    supplyIssuesMessage: string
    temporaryClosureMessage: string


     // Delivery Zone Errors
    outsideDeliveryArea: string
    outsideDeliveryAreaDesc: string
    deliveryNotAvailable: string
    deliveryCalculationFailed: string
    tryDifferentAddress: string
    selectDifferentArea: string
    maxDeliveryDistance: string

     // Success Message & Scheduling
     orderPrepared: string
     orderNumber: string
     orderOpenedWhatsApp: string
     nextSteps: string
     sendWhatsAppMessage: string
     awaitConfirmation: string
     weWillPrepareOrder: string
     storeCurrentlyClosed: string
     wouldYouLikeToSchedule: string
  }
  
  const englishTranslations: StorefrontTranslations = {
    // Navigation & Search
    search: "Search menu items...",
    allCategories: "All Categories",
    all: "All",
    
    // Status
    open: "● Open",
    closed: "● Closed",
    
    // General
    welcome: "Welcome!",
    deliveryIn: "Delivery in",
    customize: "Customize",
    add: "Add",
    outOfStock: "Out of stock",
    onlyLeft: "Only",
    left: "left!",
    
    // Order Details
    orderDetails: "Order Details",
    delivery: "Delivery",
    pickup: "Pickup",
    dineIn: "Dine-in",
    
    // Form Fields
    name: "Name",
    whatsappNumber: "WhatsApp Number",
    email: "Email",
    addressLine1: "Address Line 1",
    addressLine2: "Address Line 2",
    deliveryTime: "Delivery Time",
    pickupTime: "Pickup Time",
    arrivalTime: "Arrival Time",
    asap: "ASAP",
    mins: "mins",

    // English translations:
    now: "Now",
    schedule: "Schedule",
    selectDate: "Select Date",
    selectTime: "Select Time",
    today: "Today",
    tomorrow: "Tomorrow",
    noTimeSlots: "No available time slots for this date",
    address: "Address",
    pickupLocation: "Pickup Location",
    directions: "Directions",
    tapForDirections: "Tap for directions",
    pickupInstructions: "Please come to this location to collect your order.",
    mapView: "Map View",
    businessInfo: "Business Info",
    about: "About",
    contact: "Contact",
    hours: "Hours",
    serviceOptions: "Service Options",
    share: "Share",
    copyLink: "Copy Link",
    shareVia: "Share via",
    temporarilyClosed: "Temporarily Closed",
    expectedReopen: "Expected to reopen",
    storeTemporarilyClosed: "Store Temporarily Closed",
    storeClosedMessage: "We apologize for any inconvenience.",
    time: "Time",
    serviceFee: "Service Fee",
    popular: "Popular",
    
    // Cart & Checkout
    cartItems: "Cart Items",
    subtotal: "Subtotal",
    deliveryFee: "Delivery Fee",
    total: "Total",
    minimumOrder: "Minimum order is",
    forDelivery: "for delivery. Add",
    moreTo: "more to place your order.",
    specialInstructions: "Special Instructions",
    anySpecialRequests: "Any special requests...",
    orderViaWhatsapp: "Order via WhatsApp",
    placingOrder: "Placing Order...",
    clickingButton: "Clicking this button will open WhatsApp with your order details",
    yourOrder: "Your Order",
    
    // Product Modal
    chooseSize: "Choose Size",
    addExtras: "Add Extras",
    required: "(Required)",
    quantity: "Quantity",
    addToCart: "Add to Cart",
    
    // Placeholders
    streetAddress: "Street address",
    apartment: "Apartment, suite, etc.",
    
    // Footer
    poweredBy: "Powered by",
    
    // Empty States
    noProductsFound: "No products found",
    noProductsFoundDescription: "We couldn't find any products matching your search. Try adjusting your search terms.",
    noProductsInCategory: "No products in this category",
    noProductsInCategoryDescription: "This category doesn't have any products yet. Check back later or browse other categories.",
    tryDifferentSearch: "Try a different search",
    browseAllProducts: "Browse all products",
    comingSoon: "Coming soon!",
    checkBackLater: "We're working on adding products to this section. Please check back later.",
    freeDelivery: "Free Delivery",
    pickupAvailable: "Pickup available",
    // Closure Messages
    maintenanceMessage: "We are currently performing maintenance and will be back soon.",
    holidayMessage: "We are closed for the holiday.",
    emergencyMessage: "We are temporarily closed due to unforeseen circumstances.",
    staffShortageMessage: "We are temporarily closed due to staffing issues.",
    supplyIssuesMessage: "We are temporarily closed due to supply issues.",
    temporaryClosureMessage: "We are temporarily closed and will reopen soon.",

     // Delivery Zone Errors
  outsideDeliveryArea: "Address is outside delivery area",
  outsideDeliveryAreaDesc: "Unfortunately, we don't deliver to this address. Maximum delivery distance is",
  deliveryNotAvailable: "Delivery not available",
  deliveryCalculationFailed: "Unable to calculate delivery fee",
  tryDifferentAddress: "Try a different address",
  selectDifferentArea: "Please select an address within our delivery area",
  maxDeliveryDistance: "Maximum delivery distance",

  // Success Message & Scheduling
  orderPrepared: "Order Prepared!",
  orderNumber: "Order Number",
  orderOpenedWhatsApp: "Your order details have been prepared and WhatsApp should now be open. Please send the message to complete your order (if you haven't already sent it).",
  nextSteps: "Next Steps",
  sendWhatsAppMessage: "Send the WhatsApp message (if not sent yet)",
  awaitConfirmation: "Wait for our confirmation",
  weWillPrepareOrder: "We'll prepare your order once confirmed",
  storeCurrentlyClosed: "Store is currently closed",
  wouldYouLikeToSchedule: "Would you like to schedule your order for later instead?",

  }
  
  const albanianTranslations: StorefrontTranslations = {
    // Navigation & Search
    search: "Kërko në meny...",
    allCategories: "Të gjitha kategoritë",
    all: "Të gjitha",
    
    // Status
    open: "● Hapur",
    closed: "● Mbyllur",
    
    // General
    welcome: "Mirë se erdhet!",
    deliveryIn: "Dërgesa në",
    customize: "Personalizoni",
    add: "Shto",
    outOfStock: "Nuk ka në stok",
    onlyLeft: "Vetëm",
    left: "të mbetur!",

    now: "Tani",
    schedule: "Planifiko",
    selectDate: "Zgjidh Datën",
    selectTime: "Zgjidh Kohën",
    today: "Sot",
    tomorrow: "Nesër",
    noTimeSlots: "Nuk ka kohë të disponueshme për këtë datë",
    address: "Adresa",
    pickupLocation: "Vendi i Marrjes",
    directions: "Udhëzimet",
    tapForDirections: "Prek për udhëzime",
    pickupInstructions: "Ju lutemi ejani në këtë vendndodhje për të marrë porosinë tuaj.",
    mapView: "Pamja e Hartës",
    businessInfo: "Informacioni i Biznesit",
    about: "Rreth Nesh",
    contact: "Kontakti",
    hours: "Oraret",
    serviceOptions: "Opsionet e Shërbimit",
    share: "Shpërndaj",
    copyLink: "Kopjo Linkun",
    shareVia: "Shpërndaj përmes",
    temporarilyClosed: "Mbyllur Përkohësisht",
    expectedReopen: "Pritet të rihapet",
    storeTemporarilyClosed: "Dyqani është Mbyllur Përkohësisht",
    storeClosedMessage: "Na vjen keq për çdo shqetësim.",
    time: "Koha",
    serviceFee: "Taksa e Shërbimit",
    popular: "Popullore",
    
    // Order Details
    orderDetails: "Detajet e Porosisë",
    delivery: "Dërgesa",
    pickup: "Marrje në Lokal",
    dineIn: "Në Restorant",
    
    // Form Fields
    name: "Emri",
    whatsappNumber: "Numri i WhatsApp",
    email: "Email",
    addressLine1: "Adresa Linja 1",
    addressLine2: "Adresa Linja 2",
    deliveryTime: "Koha e Dërgesës",
    pickupTime: "Koha e Marrjes",
    arrivalTime: "Koha e Arritjes",
    asap: "Sa më shpejt",
    mins: "min",
    
    // Cart & Checkout
    cartItems: "Artikujt në Shportë",
    subtotal: "Nëntotali",
    deliveryFee: "Kostoja e Dërgesës",
    total: "Totali",
    minimumOrder: "Porosia minimale është",
    forDelivery: "për dërgesa. Shtoni",
    moreTo: "më shumë për të bërë porosinë.",
    specialInstructions: "Udhëzime Speciale",
    anySpecialRequests: "Çdo kërkesë speciale...",
    orderViaWhatsapp: "Porosit përmes WhatsApp",
    placingOrder: "Duke vendosur porosinë...",
    clickingButton: "Klikimi i këtij butoni do të hapë WhatsApp me detajet e porosisë tuaj",
    yourOrder: "Porosia Juaj",
    
    // Product Modal
    chooseSize: "Zgjidhni Madhësinë",
    addExtras: "Shtoni Ekstra",
    required: "(I detyrueshëm)",
    quantity: "Sasia",
    addToCart: "Shto në Shportë",
    
    // Placeholders
    streetAddress: "Adresa e rrugës",
    apartment: "Apartamenti, suitë, etj.",
    
    // Footer
    poweredBy: "Mundësuar nga",
    
    // Empty States
    noProductsFound: "Nuk u gjetën produkte",
    noProductsFoundDescription: "Nuk mund të gjenim produkte që përputhen me kërkimin tuaj. Provoni të ndryshoni termat e kërkimit.",
    noProductsInCategory: "Nuk ka produkte në këtë kategori",
    noProductsInCategoryDescription: "Kjo kategori nuk ka ende produkte. Kontrolloni më vonë ose shfletoni kategori të tjera.",
    tryDifferentSearch: "Provoni një kërkim tjetër",
    browseAllProducts: "Shfletoni të gjitha produktet",
    comingSoon: "Së shpejti!",
    checkBackLater: "Po punojmë për të shtuar produkte në këtë seksion. Ju lutemi kontrolloni më vonë.",
    freeDelivery: "Transport Falas",
    pickupAvailable: "Pickup Gati",
      // Closure Messages
      maintenanceMessage: "Aktualisht po kryejmë mirëmbajtje dhe do të jemi përsëri të hapur së shpejti.",
      holidayMessage: "Jemi të mbyllur për festën.",
      emergencyMessage: "Jemi të mbyllur përkohësisht për shkak të rrethanave të paparashikuara.",
      staffShortageMessage: "Jemi të mbyllur përkohësisht për shkak të problemeve me stafin.",
      supplyIssuesMessage: "Jemi të mbyllur përkohësisht për shkak të problemeve me furnizimet.",
      temporaryClosureMessage: "Jemi të mbyllur përkohësisht dhe do të rihapemi së shpejti.",

       // Delivery Zone Errors
  outsideDeliveryArea: "Adresa është jashtë zonës së dërgesës",
  outsideDeliveryAreaDesc: "Na vjen keq, nuk dërgojmë në këtë adresë. Distanca maksimale e dërgesës është",
  deliveryNotAvailable: "Dërgesa nuk është e disponueshme",
  deliveryCalculationFailed: "Nuk mund të llogarisim tarifën e dërgesës",
  tryDifferentAddress: "Provoni një adresë tjetër",
  selectDifferentArea: "Ju lutemi zgjidhni një adresë brenda zonës sonë të dërgesës",
  maxDeliveryDistance: "Distanca maksimale e dërgesës",

    // Success Message & Scheduling
    orderPrepared: "Porosia u Përgatit!",
    orderNumber: "Numri i Porosisë",
    orderOpenedWhatsApp: "Detajet e porosisë tuaj janë përgatitur dhe WhatsApp duhet të jetë hapur tani. Ju lutemi dërgoni mesazhin për të përfunduar porosinë tuaj (nëse nuk e keni dërguar ende).",
    nextSteps: "Hapat e Ardhshëm",
    sendWhatsAppMessage: "Dërgoni mesazhin në WhatsApp (nëse nuk është dërguar ende)",
    awaitConfirmation: "Prisni konfirmimin tonë",
    weWillPrepareOrder: "Do ta përgatisim porosinë tuaj pasi të konfirmohet",
    storeCurrentlyClosed: "Dyqani është aktualisht i mbyllur",
    wouldYouLikeToSchedule: "A dëshironi të planifikoni porosinë tuaj për më vonë në vend të kësaj?",
  }
  
  export const getStorefrontTranslations = (language: string): StorefrontTranslations => {
    const isAlbanian = language === 'sq' || language === 'al'
    return isAlbanian ? albanianTranslations : englishTranslations
  }