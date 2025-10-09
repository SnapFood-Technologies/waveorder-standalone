// src/utils/storefront-translations.ts

export interface StorefrontTranslations {
    // Navigation & Search
    search: string
    allCategories: string
    all: string
    
    // Status
    open: string
    closed: string


    itemOutOfStockOrMaxQuantity: string

    onlyMoreCanBeAdded: string
stockLabel: string
inCartLabel: string
    
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

    sorryOnlyStockAvailable: string

    
    // Product Modal
    chooseSize: string
    addExtras: string
    required: string
    quantity: string
    addToCart: string
    

    website: string
    yourFullName: string
    emailPlaceholder: string
    linkCopied: string
    moreSharingOptions: string

    inCartAvailable: string
onlyStockAvailable: string
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

    addItemsToCart: string
    fillRequiredInfo: string
    addDeliveryAddress: string

     // Delivery Zone Errors
    outsideDeliveryArea: string
    outsideDeliveryAreaDesc: string
    deliveryNotAvailable: string
    deliveryCalculationFailed: string
    tryDifferentAddress: string
    selectDifferentArea: string
    maxDeliveryDistance: string

    failedToCreateOrder: string
    failedToSubmitOrder: string


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

     cannotPlaceNowOrder: string
schedulingBenefits: string
guaranteedPreparation: string
noWaitingTime: string
secureYourOrder: string
continueAnyway: string
scheduleOrder: string
selectTimeForSchedule: string

close: string

 // NEW STOCK-RELATED TRANSLATIONS
 inCart: string
 available: string
 onlyAvailable: string
 item: string
 items: string
 maximumQuantityInCart: string
 canBeAdded: string
 stock: string
 max: string
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

    onlyMoreCanBeAdded: "Only {count} more can be added to cart",
stockLabel: "Stock",
inCartLabel: "In cart",

itemOutOfStockOrMaxQuantity: "Sorry, this item is out of stock or already at maximum quantity in your cart",

    
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

    
    website: "Website",
    yourFullName: "Your full name",
    emailPlaceholder: "your.email@example.com",
    linkCopied: "Link copied to clipboard!",
    moreSharingOptions: "More sharing options",

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

    sorryOnlyStockAvailable: "Sorry, only {count} {itemWord} available in stock",

    
    // Product Modal
    chooseSize: "Choose Size",
    addExtras: "Add Extras",
    required: "(Required)",
    quantity: "Quantity",
    addToCart: "Add to Cart",
    
    // Placeholders
    streetAddress: "Street address",
    apartment: "Apartment, suite, etc.",


    inCartAvailable: "{inCart} in cart, {available} available",
onlyStockAvailable: "Only {stock} available",
    
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
  failedToCreateOrder: "Failed to create order. Please try again.",
  failedToSubmitOrder: "Failed to submit order. Please try again.",


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

  cannotPlaceNowOrder: "We're currently closed and cannot accept orders for immediate delivery/pickup. However, you can schedule your order for when we're open!",
schedulingBenefits: "Why schedule your order?",
guaranteedPreparation: "Guaranteed preparation when we're open",
noWaitingTime: "No waiting - ready when you arrive",
secureYourOrder: "Secure your preferred time slot",
continueAnyway: "Continue Anyway",
scheduleOrder: "Schedule Order",
close: "Close", // English
selectTimeForSchedule: "Please select a time for your order",

addItemsToCart: "Add items to cart",
fillRequiredInfo: "Fill required information", 
addDeliveryAddress: "Add delivery address",

// NEW STOCK-RELATED TRANSLATIONS
inCart: "in cart",
available: "available",
onlyAvailable: "Only available",
item: "item",
items: "items",
maximumQuantityInCart: "Maximum quantity ({count}) already in cart",
canBeAdded: "more can be added to cart",
stock: "Stock",
max: "Max",

  }
  
  const albanianTranslations: StorefrontTranslations = {
    // Navigation & Search
    search: "Kërko në menu...",
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


    website: "Website",
    yourFullName: "Emri juaj i plotë",
    emailPlaceholder: "email.juaj@shembull.com",
    linkCopied: "Linku u kopjua në clipboard!",
    moreSharingOptions: "Më shumë opsione shpërndarjeje",
    
    onlyMoreCanBeAdded: "Vetëm {count} më shumë mund të shtohen në shportë",
stockLabel: "Stoku",
inCartLabel: "Në shportë",

itemOutOfStockOrMaxQuantity: "Na vjen keq, ky artikull është jashtë stokut ose tashmë në sasinë maksimale në shportën tënde",


    now: "Tani",
    schedule: "Skedulo",
    selectDate: "Zgjidh Datën",
    selectTime: "Zgjidh Kohën",
    today: "Sot",
    tomorrow: "Nesër",
    noTimeSlots: "Nuk ka kohë të disponueshme për këtë datë",
    address: "Adresa",
    pickupLocation: "Vendi i Marrjes",
    directions: "Udhëzimet",
    tapForDirections: "Prek për udhëzime",
    pickupInstructions: "Të lutem shko në këtë vendndodhje për të marrë porosinë tënde.",
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
    pickup: "Merr tek Biznesi",
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
    forDelivery: "për dërgesa. Shto",
    moreTo: "më shumë për të bërë porosinë.",
    specialInstructions: "Udhëzime Speciale",
    anySpecialRequests: "Çdo kërkesë speciale...",
    orderViaWhatsapp: "Porosit përmes WhatsApp",
    placingOrder: "Duke vendosur porosinë...",
    clickingButton: "Klikimi i këtij butoni do të hapë WhatsApp me detajet e porosisë tënde",
    yourOrder: "Porosia Jote",

    sorryOnlyStockAvailable: "Na vjen keq, vetëm {count} {itemWord} të disponueshme në stok",

    
    // Product Modal
    chooseSize: "Zgjidh Madhësinë",
    addExtras: "Shto Ekstra",
    required: "(I detyrueshëm)",
    quantity: "Sasia",
    addToCart: "Shto në Shportë",
    
    // Placeholders
    streetAddress: "Adresa e rrugës",
    apartment: "Apartamenti, suitë, etj.",

    inCartAvailable: "{inCart} në shportë, {available} të disponueshme", 
onlyStockAvailable: "Vetëm {stock} të disponueshme",
    
    // Footer
    poweredBy: "Mundësuar nga",
    
    // Empty States
    noProductsFound: "Nuk u gjetën produkte",
    noProductsFoundDescription: "Nuk mund të gjenim produkte që përputhen me kërkimin tënde. Provo të ndryshosh termat e kërkimit.",
    noProductsInCategory: "Nuk ka produkte në këtë kategori",
    noProductsInCategoryDescription: "Kjo kategori nuk ka ende produkte. Kontrollo më vonë ose shfleto kategori të tjera.",
    tryDifferentSearch: "Provo një kërkim tjetër",
    browseAllProducts: "Shfleto të gjitha produktet",
    comingSoon: "Së shpejti!",
    checkBackLater: "Po punojmë për të shtuar produkte në këtë seksion. Të lutem kontrollo më vonë.",
    freeDelivery: "Transport Falas",
    pickupAvailable: "Merr tek Biznesi",
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
  tryDifferentAddress: "Provo një adresë tjetër",
  selectDifferentArea: "Të lutem zgjidh një adresë brenda zonës sonë të dërgesës",
  maxDeliveryDistance: "Distanca maksimale e dërgesës",
  failedToCreateOrder: "Dështoi të krijojë porosinë. Të lutem provo përsëri.",
  failedToSubmitOrder: "Dështoi të dërgojë porosinë. Të lutem provo përsëri.",


    // Success Message & Scheduling
    orderPrepared: "Porosia u Përgatit!",
    orderNumber: "Numri i Porosisë",
    orderOpenedWhatsApp: "Detajet e porosisë tënde janë përgatitur dhe WhatsApp duhet të jetë hapur tani. Të lutem dërgo mesazhin për të përfunduar porosinë tënde (nëse nuk e ke dërguar ende).",
    nextSteps: "Hapat e Ardhshëm",
    sendWhatsAppMessage: "Dërgo mesazhin në WhatsApp (nëse nuk është dërguar ende)",
    awaitConfirmation: "Prit konfirmimin tonë",
    weWillPrepareOrder: "Do ta përgatisim porosinë tënde pasi të konfirmohet",
    storeCurrentlyClosed: "Dyqani është aktualisht i mbyllur",
    wouldYouLikeToSchedule: "A dëshiron të planifikosh porosinë tënde për më vonë në vend të kësaj?",

    cannotPlaceNowOrder: "Aktualisht jemi të mbyllur dhe nuk mund të pranojmë porosi për dërgim/marrje të menjëhershme. Megjithatë, mund ta planifikosh porosinë tënde për kur të jemi të hapur!",
schedulingBenefits: "Pse të planifikosh porosinë?",
guaranteedPreparation: "Përgatitje e garantuar kur jemi të hapur",
noWaitingTime: "Nuk ka kohë pritje - gati kur të arrish",
secureYourOrder: "Siguro kohën tënde të preferuar",
continueAnyway: "Vazhdo Sidoqoftë",
scheduleOrder: "Skedulo Porosinë",
close: "Mbyll", // Albanian
selectTimeForSchedule: "Të lutem zgjidh një kohë për porosinë tënde",
addItemsToCart: "Shto artikuj në shportë",
fillRequiredInfo: "Plotëso informacionin e kërkuar",
addDeliveryAddress: "Shto adresën e dërgesës",
  // NEW STOCK-RELATED TRANSLATIONS
  inCart: "në shportë",
  available: "të disponueshme",
  onlyAvailable: "Vetëm të disponueshme",
  item: "artikull",
  items: "artikuj",
  maximumQuantityInCart: "Sasia maksimale ({count}) tashmë në shportë",
  canBeAdded: "më shumë mund të shtohen në shportë",
  stock: "Stoku",
  max: "Maks",

  }
  
  export const getStorefrontTranslations = (language: string): StorefrontTranslations => {
    const isAlbanian = language === 'sq' || language === 'al'
    return isAlbanian ? albanianTranslations : englishTranslations
  }