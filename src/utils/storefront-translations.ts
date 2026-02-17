// src/utils/storefront-translations.ts

export interface StorefrontTranslations {
    // Navigation & Search
    search: string
    searchProducts: string
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
    
    noResultsFor: string
    result: string
    results: string
    for: string

    // Form Fields
    name: string
    whatsappNumber: string
    phone: string
    email: string
    notes: string
    addressLine1: string
    addressLine2: string
    deliveryTime: string
    pickupTime: string
    arrivalTime: string
    asap: string
    mins: string
    
    // Cart & Checkout
    cartItems: string
    productsInCart: string // For RETAIL businesses
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
    moreToProceed: string

    sorryOnlyStockAvailable: string

    
    // Product Modal
    chooseSize: string
    addExtras: string
    required: string
    quantity: string
    addToCart: string
    youSave: string
    perItem: string
    originalSubtotal: string
    discount: string
    

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
    selectCountry: string
    selectCountryFirst: string
    selectCity: string
    postalCode: string
    postalCodePlaceholder: string
    
    // Phone Validation
    invalidAlbanianPhone: string
    invalidGreekPhone: string
    invalidItalianPhone: string
    invalidSpanishPhone: string
    invalidUSPhone: string
    invalidKosovoPhone: string
    invalidNorthMacedoniaPhone: string
    invalidPhone: string
    phoneFormatAlbania: string
    phoneFormatGreece: string
    phoneFormatItaly: string
    phoneFormatSpain: string
    phoneFormatKosovo: string
    phoneFormatNorthMacedonia: string
    phoneFormatUS: string
    phoneFormatGeneric: string
    
    // Footer
    poweredBy: string
    
    // Legal Pages
    backTo: string
    legalPolicies: string
    legalPoliciesCta: string
    legalPoliciesSubtitle: string
    noPagesAvailable: string
    
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
    free: string
    addMoreForFreeDelivery: string
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

    // Address Autofill Detection
    addressAutofillWarning: string
    confirmAddressAbove: string
    confirmDeliveryAddress: string
    selectAddressFromSuggestions: string

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
     
     // Direct Notification (Twilio) Success Message
     orderSentDirect: string
     orderSentDirectMessage: string
     directNextSteps: string
     directStep1: string
     directStep2: string
     directStep3: string
     youCanCloseThisPage: string

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
 inBooking: string
 inBookingPlural: string
 available: string
 onlyAvailable: string
 item: string
 items: string
 maximumQuantityInCart: string
 canBeAdded: string
    stock: string
    max: string
    loading: string
    loadingMore: string
    retry: string
    loadingCountries: string
    loadingCities: string
    selectDeliveryMethod: string
    pleaseSelectDeliveryMethod: string
    enterAddressForDelivery: string
    deliveryMethod: string
    noDeliveryOptions: string
    
    // Filter
    filterProducts: string
    priceRange: string
    minPrice: string
    maxPrice: string
    noLimit: string
    categories: string
    sortBy: string
    sortByNameAsc: string
    sortByNameDesc: string
    sortByPriceAsc: string
    sortByPriceDesc: string
    clearAll: string
    applyFilters: string
    sort: string
    
    // Custom Filtering
    collections: string
    groups: string
    brands: string
    
    // Product Loading
    tryAgain: string
    loadMore: string
    
    // Salon/Appointment specific
    bookAppointment: string
    selectedServices: string
    appointmentDate: string
    appointmentTime: string
    submitting: string
    bookViaWhatsapp: string
    addToBooking: string
    specialRequests: string
    
    // Invoice/Receipt Selection (for Greek storefronts)
    invoiceOrReceipt: string
    invoiceOrReceiptQuestion: string
    selectInvoiceOrReceipt: string
    invoice: string
    receipt: string
    invoiceMinimumOrderError: string
    invoiceMinimumOrderErrorWithCurrent: string
    invoiceNote: string
    invoiceDetails: string
    taxId: string
    taxIdRequired: string
    taxIdDigits: string
    taxIdDigitsCount: string
    companyName: string
    taxOffice: string
    enterValidTaxId: string
  }
  
  const englishTranslations: StorefrontTranslations = {
    // Navigation & Search
    search: "Search menu items...",
    searchProducts: "Search products",
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
    phone: "Phone",
    email: "Email",
    notes: "Notes",
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
    productsInCart: "Products in Cart", // For RETAIL businesses
    subtotal: "Subtotal",
    deliveryFee: "Delivery Fee",
    total: "Total",
    minimumOrder: "Minimum order is",
    forDelivery: "for delivery. Add ",
    moreTo: "more to place your order.",
    specialInstructions: "Special Instructions",
    anySpecialRequests: "Any special requests...",
    orderViaWhatsapp: "Order via WhatsApp",
    placingOrder: "Placing Order...",
    clickingButton: "Clicking this button will open WhatsApp with your order details",
    yourOrder: "Your Order",
    moreToProceed: "more to proceed.",

    sorryOnlyStockAvailable: "Sorry, only {count} {itemWord} available in stock",

    
    // Product Modal
    chooseSize: "Choose Option",
    addExtras: "Add Extras",
    required: "(Required)",
    quantity: "Quantity",
    addToCart: "Add to Cart",
    youSave: "You save",
    perItem: "per item",
    originalSubtotal: "Original Subtotal",
    discount: "Discount",
    
    // Placeholders
    streetAddress: "Street address",
    apartment: "Apartment, suite, etc.",
    selectCountry: "Select Country",
    selectCountryFirst: "Select Country first",
    selectCity: "Select City",
    postalCode: "Postal Code",
    postalCodePlaceholder: "Postal code",
    
    // Phone Validation
    invalidAlbanianPhone: "Please enter a valid Albanian phone number",
    invalidGreekPhone: "Please enter a valid Greek phone number",
    invalidItalianPhone: "Please enter a valid Italian phone number",
    invalidSpanishPhone: "Please enter a valid Spanish phone number",
    invalidUSPhone: "Please enter a valid US phone number",
    invalidKosovoPhone: "Please enter a valid Kosovo phone number",
    invalidNorthMacedoniaPhone: "Please enter a valid North Macedonia phone number",
    invalidPhone: "Please enter a valid phone number",
    phoneFormatAlbania: "Format: +355 68 123 4567",
    phoneFormatGreece: "Format: +30 694 123 4567",
    phoneFormatItaly: "Format: +39 34 3123 4567",
    phoneFormatSpain: "Format: +34 612 345 678",
    phoneFormatKosovo: "Format: +383 44 123 456",
    phoneFormatNorthMacedonia: "Format: +389 70 123 456",
    phoneFormatUS: "Format: +1 (555) 123-4567",
    phoneFormatGeneric: "Enter your WhatsApp number with country code",


    inCartAvailable: "{inCart} in cart, {available} available",
onlyStockAvailable: "Only {stock} available",
    
    // Footer
    poweredBy: "Powered by",
    
    // Legal Pages
    backTo: "Back to",
    legalPolicies: "Legal & Policies",
    legalPoliciesCta: "Terms & Policies",
    legalPoliciesSubtitle: "View our terms, policies, and legal information",
    noPagesAvailable: "No pages available",
    
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
    free: "Free",
    addMoreForFreeDelivery: "Add {amount} more for free delivery!",
    pickupAvailable: "Pickup available",
    // Closure Messages
    maintenanceMessage: "We are currently performing maintenance and will be back soon.",
    holidayMessage: "We are closed for the holiday.",
    emergencyMessage: "We are temporarily closed due to unforeseen circumstances.",
    staffShortageMessage: "We are temporarily closed due to staffing issues.",
    supplyIssuesMessage: "We are temporarily closed due to supply issues.",
    temporaryClosureMessage: "We are temporarily closed and will reopen soon.",

    noResultsFor: 'No results for',
    result: 'result',
    results: 'results',
    for: 'for',


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
  orderPrepared: "Order Sent!",
  orderNumber: "Order Number",
  orderOpenedWhatsApp: "Your order has been sent successfully. The store has been notified, but you can also send a WhatsApp message if you want to communicate directly with the store.",
  nextSteps: "What's Next?",
  sendWhatsAppMessage: "Optional: Send WhatsApp message to communicate with store",
  awaitConfirmation: "You will receive order status updates via email or WhatsApp",
  weWillPrepareOrder: "The store will process your order and notify you of any status changes",
  storeCurrentlyClosed: "Store is currently closed",
  wouldYouLikeToSchedule: "Would you like to schedule your order for later instead?",
  
  // Direct Notification (Twilio) Success Message
  orderSentDirect: "Order Sent Successfully!",
  orderSentDirectMessage: "Your order has been sent directly to the store via WhatsApp. They have received all your order details and will contact you shortly.",
  directNextSteps: "What Happens Now?",
  directStep1: "The store has received your order",
  directStep2: "They will prepare your order",
  directStep3: "You'll be contacted for any updates",
  youCanCloseThisPage: "You can safely close this page",

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

// Address Autofill Detection
addressAutofillWarning: "Please type your address and select from the suggestions to confirm your delivery location",
confirmAddressAbove: "Please confirm your delivery address above",
confirmDeliveryAddress: "Confirm your delivery address",
selectAddressFromSuggestions: "Please type and select your address from the suggestions",

// NEW STOCK-RELATED TRANSLATIONS
inCart: "in cart",
    inBooking: "in booking",
    inBookingPlural: "in booking",
available: "available",
onlyAvailable: "Only available",
item: "item",
items: "items",
maximumQuantityInCart: "Maximum quantity ({count}) already in cart",
canBeAdded: "more can be added to cart",
    stock: "Stock",
    max: "Max",
    loading: "Loading options...",
    loadingMore: "Loading more products...",
    retry: "Retry",
    loadingCountries: "Loading countries...",
    loadingCities: "Loading cities...",
    selectDeliveryMethod: "Select delivery method below",
    pleaseSelectDeliveryMethod: "Please select a delivery method",
    enterAddressForDelivery: "Enter address to see delivery options",
    deliveryMethod: "Delivery Method",
    noDeliveryOptions: "No delivery options available for this city",
    
    // Filter
    filterProducts: "Filter Products",
    priceRange: "Price Range",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    noLimit: "No limit",
    categories: "Categories",
    sortBy: "Sort By",
    sortByNameAsc: "Name (A-Z)",
    sortByNameDesc: "Name (Z-A)",
    sortByPriceAsc: "Price (Low to High)",
    sortByPriceDesc: "Price (High to Low)",
    clearAll: "Clear All",
    applyFilters: "Apply Filters",
    sort: "Sort",
    
    // Custom Filtering
    collections: "Collections",
    groups: "Groups", 
    brands: "Brands",
    
    // Product Loading
    tryAgain: "Try Again",
    loadMore: "Load More",
    
    // Salon/Appointment specific
    bookAppointment: "Book Appointment",
    selectedServices: "Selected Services",
    appointmentDate: "Appointment Date",
    appointmentTime: "Appointment Time",
    submitting: "Submitting...",
    bookViaWhatsapp: "Book via WhatsApp",
    addToBooking: "Add to Booking",
    specialRequests: "Any special requests...",
    
    // Invoice/Receipt Selection (for Greek storefronts)
    invoiceOrReceipt: "Invoice or Receipt",
    invoiceOrReceiptQuestion: "Invoice or Receipt? *",
    selectInvoiceOrReceipt: "Select if you need an invoice or receipt for your order",
    invoice: "Invoice",
    receipt: "Receipt",
    invoiceMinimumOrderError: "To select Invoice, your order must be at least {amount}",
    invoiceMinimumOrderErrorWithCurrent: "To select Invoice, your order must be at least {amount}. Current order: {current}",
    invoiceNote: "Note: We will contact you to ask for any details if you need to include in your Invoice.",
    invoiceDetails: "Invoice Details",
    taxId: "Tax ID (AFM)",
    taxIdRequired: "Tax ID (AFM) *",
    taxIdDigits: "9 digits",
    taxIdDigitsCount: "9 digits ({count}/9)",
    companyName: "Company Name",
    taxOffice: "Tax Office (ΔΟΥ)",
    enterValidTaxId: "Please enter a valid Tax ID (9 digits)"

  }
  
  const albanianTranslations: StorefrontTranslations = {
    // Navigation & Search
    search: "Kërko në menu...",
    searchProducts: "Kërko produkte",
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
    moreSharingOptions: "Më shumë opsione",

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
    popular: "Popular",
    
    // Order Details
    orderDetails: "Detajet e Porosisë",
    delivery: "Dërgesa",
    pickup: "Merr tek Biznesi",
    dineIn: "Në Restorant",
    
    // Form Fields
    name: "Emri",
    whatsappNumber: "Numri i WhatsApp",
    phone: "Telefoni",
    email: "Email",
    notes: "Shënime",
    addressLine1: "Adresa Linja 1",
    addressLine2: "Adresa Linja 2",
    deliveryTime: "Koha e Dërgesës",
    pickupTime: "Koha e Marrjes",
    arrivalTime: "Koha e Arritjes",
    asap: "Sa më shpejt",
    mins: "min",
    
    // Cart & Checkout
    cartItems: "Artikujt në Shportë",
    productsInCart: "Produkte në Shportë", // For RETAIL businesses
    subtotal: "Nëntotali",
    deliveryFee: "Kostoja e Dërgesës",
    total: "Totali",
    minimumOrder: "Porosia minimale është",
    forDelivery: "për dërgesa. Shto ",
    moreTo: "më shumë për të bërë porosinë.",
    specialInstructions: "Udhëzime Speciale",
    anySpecialRequests: "Çdo kërkesë speciale...",
    orderViaWhatsapp: "Porosit përmes WhatsApp",
    placingOrder: "Duke vendosur porosinë...",
    clickingButton: "Klikimi i këtij butoni do të hapë WhatsApp me detajet e porosisë tënde",
    yourOrder: "Porosia Jote",
    moreToProceed: "më shumë për të bërë porosinë.",
    sorryOnlyStockAvailable: "Na vjen keq, vetëm {count} {itemWord} të disponueshme në stok",

    
    // Product Modal
    chooseSize: "Zgjidh Opsionin",
    addExtras: "Shto Ekstra",
    required: "(I detyrueshëm)",
    quantity: "Sasia",
    addToCart: "Shto në Shportë",
    youSave: "Ti kursen",
    perItem: "për artikull",
    originalSubtotal: "Nëntotali Origjinal",
    discount: "Zbritje",
    
    noResultsFor: 'Nuk ka rezultate për',
    result: 'rezultat',
    results: 'rezultate',
    for: 'për',

    // Placeholders
    streetAddress: "Rruga",
    apartment: "Apartamenti, suitë, etj.",
    selectCountry: "Zgjidh Shtetin",
    selectCountryFirst: "Zgjidhni shtetin së pari",
    selectCity: "Zgjidh Qytetin",
    postalCode: "Kodi Postar",
    postalCodePlaceholder: "Kodi postar",
    
    // Phone Validation
    invalidAlbanianPhone: "Ju lutem shkruani një numër telefoni shqiptar të vlefshëm",
    invalidGreekPhone: "Ju lutem shkruani një numër telefoni grek të vlefshëm",
    invalidItalianPhone: "Ju lutem shkruani një numër telefoni italian të vlefshëm",
    invalidSpanishPhone: "Ju lutem shkruani një numër telefoni spanjoll të vlefshëm",
    invalidUSPhone: "Ju lutem shkruani një numër telefoni amerikan të vlefshëm",
    invalidKosovoPhone: "Ju lutem shkruani një numër telefoni kosovar të vlefshëm",
    invalidNorthMacedoniaPhone: "Ju lutem shkruani një numër telefoni maqedonas të vlefshëm",
    invalidPhone: "Ju lutem shkruani një numër telefoni të vlefshëm",
    phoneFormatAlbania: "Formati: +355 68 123 4567",
    phoneFormatGreece: "Formati: +30 694 123 4567",
    phoneFormatItaly: "Formati: +39 34 3123 4567",
    phoneFormatSpain: "Formati: +34 612 345 678",
    phoneFormatKosovo: "Formati: +383 44 123 456",
    phoneFormatNorthMacedonia: "Formati: +389 70 123 456",
    phoneFormatUS: "Formati: +1 (555) 123-4567",
    phoneFormatGeneric: "Shkruani numrin tuaj të WhatsApp me kodin e shtetit",

    inCartAvailable: "{inCart} në shportë, {available} të disponueshme", 
onlyStockAvailable: "Vetëm {stock} të disponueshme",
    
    // Footer
    poweredBy: "Mundësuar nga",
    
    // Legal Pages
    backTo: "Kthehu te",
    legalPolicies: "Ligjore & Politika",
    legalPoliciesCta: "Terma & Politika",
    legalPoliciesSubtitle: "Shikoni termat, politikën dhe informacionin ligjor",
    noPagesAvailable: "Nuk ka faqe të disponueshme",
    
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
    free: "Falas",
    addMoreForFreeDelivery: "Shto {amount} më shumë për transport falas!",
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
    orderPrepared: "Porosia u Dërgua!",
    orderNumber: "Numri i Porosisë",
    orderOpenedWhatsApp: "Porosia juaj u dërgua me sukses. Dyqani është njoftuar, por mundeni edhe të dërgoni një mesazh WhatsApp nëse dëshironi të komunikoni drejtpërdrejt me dyqanin.",
    nextSteps: "Ç'ndodh Tjetër?",
    sendWhatsAppMessage: "Opsionale: Dërgoni mesazh WhatsApp për të komunikuar me dyqanin",
    awaitConfirmation: "Do të merrni përditësime për statusin e porosisë me email ose WhatsApp",
    weWillPrepareOrder: "Dyqani do ta përpunojë porosinë tuaj dhe do t'ju njoftojë për çdo ndryshim statusi",
    storeCurrentlyClosed: "Dyqani është aktualisht i mbyllur",
    wouldYouLikeToSchedule: "A dëshiron të planifikosh porosinë tënde për më vonë në vend të kësaj?",
    
    // Direct Notification (Twilio) Success Message
    orderSentDirect: "Porosia u Dërgua me Sukses!",
    orderSentDirectMessage: "Porosia juaj u dërgua drejtpërdrejt te dyqani përmes WhatsApp. Ata kanë marrë të gjitha detajet e porosisë suaj dhe do t'ju kontaktojnë së shpejti.",
    directNextSteps: "Çfarë Ndodh Tani?",
    directStep1: "Dyqani ka marrë porosinë tuaj",
    directStep2: "Ata do të përgatisin porosinë tuaj",
    directStep3: "Do të kontaktoheni për çdo përditësim",
    youCanCloseThisPage: "Mund ta mbyllni këtë faqe me siguri",

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

  // Address Autofill Detection
  addressAutofillWarning: "Ju lutem shkruani adresën tuaj dhe zgjidhni nga sugjerimet për të konfirmuar vendndodhjen e dërgesës",
  confirmAddressAbove: "Ju lutem konfirmoni adresën e dërgesës më sipër",
  confirmDeliveryAddress: "Konfirmoni adresën e dërgesës",
  selectAddressFromSuggestions: "Ju lutem shkruani dhe zgjidhni adresën tuaj nga sugjerimet",

  // NEW STOCK-RELATED TRANSLATIONS
  inCart: "në shportë",
  inBooking: "në rezervim",
  inBookingPlural: "në rezervim",
  available: "të disponueshme",
  onlyAvailable: "Vetëm të disponueshme",
  item: "artikull",
  items: "artikuj",
  maximumQuantityInCart: "Sasia maksimale ({count}) tashmë në shportë",
  canBeAdded: "më shumë mund të shtohen në shportë",
    stock: "Stoku",
    max: "Maks",
    loading: "Duke ngarkuar opsionet...",
    loadingMore: "Duke ngarkuar më shumë produkte...",
    retry: "Provo përsëri",
    loadingCountries: "Duke ngarkuar shtetet...",
    loadingCities: "Duke ngarkuar qytetet...",
    selectDeliveryMethod: "Zgjidh metodën e dërgesës më poshtë",
    pleaseSelectDeliveryMethod: "Ju lutem zgjidhni një metodë dërgese",
    enterAddressForDelivery: "Shkruani adresën për të parë opsionet e dërgesës",
    deliveryMethod: "Metoda e Dërgesës",
    noDeliveryOptions: "Nuk ka opsione dërgese të disponueshme për këtë qytet",
    
    // Filter
    filterProducts: "Filtro Produktet",
    priceRange: "Gama e Çmimeve",
    minPrice: "Çmimi Minimal",
    maxPrice: "Çmimi Maksimal",
    noLimit: "Pa limit",
    categories: "Kategoritë",
    sortBy: "Rendit Sipas",
    sortByNameAsc: "Emri (A-Z)",
    sortByNameDesc: "Emri (Z-A)",
    sortByPriceAsc: "Çmimi (Nga më i ulët)",
    sortByPriceDesc: "Çmimi (Nga më i lartë)",
    clearAll: "Pastro Të Gjitha",
    applyFilters: "Apliko Filtra",
    sort: "Rendit",
    
    // Custom Filtering
    collections: "Koleksionet",
    groups: "Grupet",
    brands: "Markat",
    
    // Product Loading
    tryAgain: "Provo Përsëri",
    loadMore: "Shfaq Më Shumë",
    
    // Salon/Appointment specific
    bookAppointment: "Rezervo Takim",
    selectedServices: "Shërbimet e Zgjedhura",
    appointmentDate: "Data e Takimit",
    appointmentTime: "Ora e Takimit",
    submitting: "Duke dërguar...",
    bookViaWhatsapp: "Rezervo përmes WhatsApp",
    addToBooking: "Shto në Rezervim",
    specialRequests: "Kërkesa të veçanta...",
    
    // Invoice/Receipt Selection (for Greek storefronts)
    invoiceOrReceipt: "Faturë ose Faturë",
    invoiceOrReceiptQuestion: "Faturë ose Faturë? *",
    selectInvoiceOrReceipt: "Zgjidhni nëse keni nevojë për një faturë ose faturë për porosinë tuaj",
    invoice: "Faturë",
    receipt: "Faturë",
    invoiceMinimumOrderError: "Për të zgjedhur Faturë, porosia juaj duhet të jetë të paktën {amount}",
    invoiceMinimumOrderErrorWithCurrent: "Për të zgjedhur Faturë, porosia juaj duhet të jetë të paktën {amount}. Porosia aktuale: {current}",
    invoiceNote: "Shënim: Do të ju kontaktojmë për të kërkuar çdo detaj nëse keni nevojë të përfshini në Faturën tuaj.",
    invoiceDetails: "Detajet e Faturës",
    taxId: "Numri i Taksës (AFM)",
    taxIdRequired: "Numri i Taksës (AFM) *",
    taxIdDigits: "9 shifra",
    taxIdDigitsCount: "9 shifra ({count}/9)",
    companyName: "Emri i Kompanisë",
    taxOffice: "Zyra e Taksave (ΔΟΥ)",
    enterValidTaxId: "Ju lutem shkruani një numër taksë të vlefshëm (9 shifra)"

  }

  const spanishTranslations: StorefrontTranslations = {
    // Navigation & Search
    search: "Buscar en el menú...",
    searchProducts: "Buscar productos",
    allCategories: "Todas las categorías",
    all: "Todas",
    
    // Status
    open: "● Abierto",
    closed: "● Cerrado",
    
    // General
    welcome: "¡Bienvenido!",
    deliveryIn: "Entrega en",
    customize: "Personalizar",
    add: "Añadir",
    outOfStock: "Sin stock",
    onlyLeft: "Solo",
    left: "disponibles!",

    onlyMoreCanBeAdded: "Solo {count} más se pueden añadir al carrito",
    stockLabel: "Stock",
    inCartLabel: "En carrito",

    itemOutOfStockOrMaxQuantity: "Lo sentimos, este artículo está sin stock o ya está en la cantidad máxima en tu carrito",

    
    // Order Details
    orderDetails: "Detalles del Pedido",
    delivery: "Entrega",
    pickup: "Recogida",
    dineIn: "Comer aquí",
    
    // Form Fields
    name: "Nombre",
    whatsappNumber: "Número de WhatsApp",
    phone: "Teléfono",
    email: "Email",
    notes: "Notas",
    addressLine1: "Dirección Línea 1",
    addressLine2: "Dirección Línea 2",
    deliveryTime: "Hora de Entrega",
    pickupTime: "Hora de Recogida",
    arrivalTime: "Hora de Llegada",
    asap: "LO ANTES POSIBLE",
    mins: "min",

    
    website: "Sitio web",
    yourFullName: "Tu nombre completo",
    emailPlaceholder: "tu.email@ejemplo.com",
    linkCopied: "¡Enlace copiado al portapapeles!",
    moreSharingOptions: "Más opciones de compartir",

    // Spanish translations:
    now: "Ahora",
    schedule: "Programar",
    selectDate: "Seleccionar Fecha",
    selectTime: "Seleccionar Hora",
    today: "Hoy",
    tomorrow: "Mañana",
    noTimeSlots: "No hay horarios disponibles para esta fecha",
    address: "Dirección",
    pickupLocation: "Ubicación de Recogida",
    directions: "Direcciones",
    tapForDirections: "Toca para ver direcciones",
    pickupInstructions: "Por favor, ven a esta ubicación para recoger tu pedido.",
    mapView: "Vista de Mapa",
    businessInfo: "Información del Negocio",
    about: "Acerca de",
    contact: "Contacto",
    hours: "Horarios",
    serviceOptions: "Opciones de Servicio",
    share: "Compartir",
    copyLink: "Copiar Enlace",
    shareVia: "Compartir vía",
    temporarilyClosed: "Cerrado Temporalmente",
    expectedReopen: "Se espera reabrir",
    storeTemporarilyClosed: "Tienda Cerrada Temporalmente",
    storeClosedMessage: "Disculpa las molestias.",
    time: "Hora",
    serviceFee: "Tarifa de Servicio",
    popular: "Popular",
    
    // Cart & Checkout
    cartItems: "Artículos en el Carrito",
    productsInCart: "Productos en el Carrito", // For RETAIL businesses
    subtotal: "Subtotal",
    deliveryFee: "Tarifa de Entrega",
    total: "Total",
    minimumOrder: "El pedido mínimo es",
    forDelivery: "para entrega. Añade ",
    moreTo: "más para realizar tu pedido.",
    specialInstructions: "Instrucciones Especiales",
    anySpecialRequests: "Cualquier solicitud especial...",
    orderViaWhatsapp: "Pedir por WhatsApp",
    placingOrder: "Realizando Pedido...",
    clickingButton: "Al hacer clic en este botón se abrirá WhatsApp con los detalles de tu pedido",
    yourOrder: "Tu Pedido",
    moreToProceed: "más para realizar tu pedido.",
    sorryOnlyStockAvailable: "Lo sentimos, solo {count} {itemWord} disponibles en stock",

    
    // Product Modal
    chooseSize: "Elegir Opción",
    addExtras: "Añadir Extras",
    required: "(Obligatorio)",
    quantity: "Cantidad",
    addToCart: "Añadir al Carrito",
    youSave: "Ahorras",
    perItem: "por artículo",
    originalSubtotal: "Subtotal Original",
    discount: "Descuento",
    
    // Placeholders
    streetAddress: "Dirección",
    apartment: "Apartamento, suite, etc.",
    selectCountry: "Seleccionar País",
    selectCountryFirst: "Seleccione el país primero",
    selectCity: "Seleccionar Ciudad",
    postalCode: "Código Postal",
    postalCodePlaceholder: "Código postal",
    
    // Phone Validation
    invalidAlbanianPhone: "Por favor, ingresa un número de teléfono albanés válido",
    invalidGreekPhone: "Por favor, ingresa un número de teléfono griego válido",
    invalidItalianPhone: "Por favor, ingresa un número de teléfono italiano válido",
    invalidSpanishPhone: "Por favor, ingresa un número de teléfono español válido",
    invalidUSPhone: "Por favor, ingresa un número de teléfono estadounidense válido",
    invalidKosovoPhone: "Por favor, ingresa un número de teléfono kosovar válido",
    invalidNorthMacedoniaPhone: "Por favor, ingresa un número de teléfono macedonio válido",
    invalidPhone: "Por favor, ingresa un número de teléfono válido",
    phoneFormatAlbania: "Formato: +355 68 123 4567",
    phoneFormatGreece: "Formato: +30 694 123 4567",
    phoneFormatItaly: "Formato: +39 34 3123 4567",
    phoneFormatSpain: "Formato: +34 612 345 678",
    phoneFormatKosovo: "Formato: +383 44 123 456",
    phoneFormatNorthMacedonia: "Formato: +389 70 123 456",
    phoneFormatUS: "Formato: +1 (555) 123-4567",
    phoneFormatGeneric: "Ingresa tu número de WhatsApp con el código de país",

    inCartAvailable: "{inCart} en carrito, {available} disponibles",
    onlyStockAvailable: "Solo {stock} disponibles",
    
    // Footer
    poweredBy: "Desarrollado por",
    
    // Legal Pages
    backTo: "Volver a",
    legalPolicies: "Legal y Políticas",
    legalPoliciesCta: "Términos y Políticas",
    legalPoliciesSubtitle: "Ver nuestros términos, políticas e información legal",
    noPagesAvailable: "No hay páginas disponibles",
    
    // Empty States
    noProductsFound: "No se encontraron productos",
    noProductsFoundDescription: "No pudimos encontrar productos que coincidan con tu búsqueda. Intenta ajustar tus términos de búsqueda.",
    noProductsInCategory: "No hay productos en esta categoría",
    noProductsInCategoryDescription: "Esta categoría aún no tiene productos. Vuelve más tarde o explora otras categorías.",
    tryDifferentSearch: "Prueba una búsqueda diferente",
    browseAllProducts: "Explorar todos los productos",
    comingSoon: "¡Próximamente!",
    checkBackLater: "Estamos trabajando en añadir productos a esta sección. Por favor, vuelve más tarde.",
    freeDelivery: "Entrega Gratis",
    free: "Gratis",
    addMoreForFreeDelivery: "¡Añade {amount} más para entrega gratis!",
    pickupAvailable: "Recogida disponible",
    // Closure Messages
    maintenanceMessage: "Actualmente estamos realizando mantenimiento y volveremos pronto.",
    holidayMessage: "Estamos cerrados por las vacaciones.",
    emergencyMessage: "Estamos cerrados temporalmente debido a circunstancias imprevistas.",
    staffShortageMessage: "Estamos cerrados temporalmente debido a problemas de personal.",
    supplyIssuesMessage: "Estamos cerrados temporalmente debido a problemas de suministro.",
    temporaryClosureMessage: "Estamos cerrados temporalmente y reabriremos pronto.",

    noResultsFor: 'No hay resultados para',
    result: 'resultado',
    results: 'resultados',
    for: 'para',

     // Delivery Zone Errors
  outsideDeliveryArea: "La dirección está fuera del área de entrega",
  outsideDeliveryAreaDesc: "Desafortunadamente, no entregamos a esta dirección. La distancia máxima de entrega es",
  deliveryNotAvailable: "Entrega no disponible",
  deliveryCalculationFailed: "No se pudo calcular la tarifa de entrega",
  tryDifferentAddress: "Prueba una dirección diferente",
  selectDifferentArea: "Por favor, selecciona una dirección dentro de nuestra área de entrega",
  maxDeliveryDistance: "Distancia máxima de entrega",
  failedToCreateOrder: "Error al crear el pedido. Por favor, inténtalo de nuevo.",
  failedToSubmitOrder: "Error al enviar el pedido. Por favor, inténtalo de nuevo.",

  // Success Message & Scheduling
  orderPrepared: "¡Pedido Enviado!",
  orderNumber: "Número de Pedido",
  orderOpenedWhatsApp: "Tu pedido ha sido enviado con éxito. La tienda ha sido notificada, pero también puedes enviar un mensaje de WhatsApp si deseas comunicarte directamente con la tienda.",
  nextSteps: "¿Qué Sigue?",
  sendWhatsAppMessage: "Opcional: Envía un mensaje de WhatsApp para comunicarte con la tienda",
  awaitConfirmation: "Recibirás actualizaciones del estado del pedido por email o WhatsApp",
  weWillPrepareOrder: "La tienda procesará tu pedido y te notificará de cualquier cambio de estado",
  storeCurrentlyClosed: "La tienda está actualmente cerrada",
  wouldYouLikeToSchedule: "¿Te gustaría programar tu pedido para más tarde?",
  
  // Direct Notification (Twilio) Success Message
  orderSentDirect: "¡Pedido Enviado con Éxito!",
  orderSentDirectMessage: "Tu pedido ha sido enviado directamente a la tienda por WhatsApp. Han recibido todos los detalles de tu pedido y te contactarán pronto.",
  directNextSteps: "¿Qué Sucede Ahora?",
  directStep1: "La tienda ha recibido tu pedido",
  directStep2: "Prepararán tu pedido",
  directStep3: "Te contactarán para cualquier actualización",
  youCanCloseThisPage: "Puedes cerrar esta página de forma segura",

  cannotPlaceNowOrder: "Actualmente estamos cerrados y no podemos aceptar pedidos para entrega/recogida inmediata. Sin embargo, ¡puedes programar tu pedido para cuando estemos abiertos!",
  schedulingBenefits: "¿Por qué programar tu pedido?",
  guaranteedPreparation: "Preparación garantizada cuando estemos abiertos",
  noWaitingTime: "Sin espera - listo cuando llegues",
  secureYourOrder: "Asegura tu horario preferido",
  continueAnyway: "Continuar de Todos Modos",
  scheduleOrder: "Programar Pedido",
  close: "Cerrar",
  selectTimeForSchedule: "Por favor, selecciona una hora para tu pedido",
  addItemsToCart: "Añadir artículos al carrito",
  fillRequiredInfo: "Completar información requerida",
  addDeliveryAddress: "Añadir dirección de entrega",

  // Address Autofill Detection
  addressAutofillWarning: "Por favor, escribe tu dirección y selecciónala de las sugerencias para confirmar tu ubicación de entrega",
  confirmAddressAbove: "Por favor, confirma tu dirección de entrega arriba",
  confirmDeliveryAddress: "Confirma tu dirección de entrega",
  selectAddressFromSuggestions: "Por favor, escribe y selecciona tu dirección de las sugerencias",

  // NEW STOCK-RELATED TRANSLATIONS
  inCart: "en carrito",
  inBooking: "en reserva",
  inBookingPlural: "en reserva",
  available: "disponibles",
  onlyAvailable: "Solo disponibles",
  item: "artículo",
  items: "artículos",
  maximumQuantityInCart: "Cantidad máxima ({count}) ya en carrito",
  canBeAdded: "más se pueden añadir al carrito",
    stock: "Stock",
    max: "Máx",
    loading: "Cargando opciones...",
    loadingMore: "Cargando más productos...",
    retry: "Reintentar",
    loadingCountries: "Cargando países...",
    loadingCities: "Cargando ciudades...",
    selectDeliveryMethod: "Selecciona el método de entrega a continuación",
    pleaseSelectDeliveryMethod: "Por favor selecciona un método de entrega",
    enterAddressForDelivery: "Ingresa la dirección para ver las opciones de entrega",
    deliveryMethod: "Método de Entrega",
    noDeliveryOptions: "No hay opciones de entrega disponibles para esta ciudad",
    
    // Filter
    filterProducts: "Filtrar Productos",
    priceRange: "Rango de Precios",
    minPrice: "Precio Mínimo",
    maxPrice: "Precio Máximo",
    noLimit: "Sin límite",
    categories: "Categorías",
    sortBy: "Ordenar Por",
    sortByNameAsc: "Nombre (A-Z)",
    sortByNameDesc: "Nombre (Z-A)",
    sortByPriceAsc: "Precio (Menor a Mayor)",
    sortByPriceDesc: "Precio (Mayor a Menor)",
    clearAll: "Limpiar Todo",
    applyFilters: "Aplicar Filtros",
    sort: "Ordenar",
    
    // Custom Filtering
    collections: "Colecciones",
    groups: "Grupos",
    brands: "Marcas",
    
    // Product Loading
    tryAgain: "Intentar de Nuevo",
    loadMore: "Cargar Más",
    
    // Salon/Appointment specific
    bookAppointment: "Reservar Cita",
    selectedServices: "Servicios Seleccionados",
    appointmentDate: "Fecha de la Cita",
    appointmentTime: "Hora de la Cita",
    submitting: "Enviando...",
    bookViaWhatsapp: "Reservar por WhatsApp",
    addToBooking: "Añadir a Reserva",
    specialRequests: "Solicitudes especiales...",
    
    // Invoice/Receipt Selection (for Greek storefronts)
    invoiceOrReceipt: "Factura o Recibo",
    invoiceOrReceiptQuestion: "¿Factura o Recibo? *",
    selectInvoiceOrReceipt: "Seleccione si necesita una factura o recibo para su pedido",
    invoice: "Factura",
    receipt: "Recibo",
    invoiceMinimumOrderError: "Para seleccionar Factura, su pedido debe ser de al menos {amount}",
    invoiceMinimumOrderErrorWithCurrent: "Para seleccionar Factura, su pedido debe ser de al menos {amount}. Pedido actual: {current}",
    invoiceNote: "Nota: Nos pondremos en contacto con usted para solicitar cualquier detalle si necesita incluir en su Factura.",
    invoiceDetails: "Detalles de la Factura",
    taxId: "ID Fiscal (AFM)",
    taxIdRequired: "ID Fiscal (AFM) *",
    taxIdDigits: "9 dígitos",
    taxIdDigitsCount: "9 dígitos ({count}/9)",
    companyName: "Nombre de la Empresa",
    taxOffice: "Oficina Fiscal (ΔΟΥ)",
    enterValidTaxId: "Por favor ingrese un ID fiscal válido (9 dígitos)"

  }

  const greekTranslations: StorefrontTranslations = {
    // Navigation & Search
    search: "Αναζήτηση στο μενού...",
    searchProducts: "Αναζήτηση προϊόντων",
    allCategories: "Όλες οι κατηγορίες",
    all: "Όλα",
    
    // Status
    open: "● Ανοιχτό",
    closed: "● Κλειστό",
    
    // General
    welcome: "Καλώς ήρθατε!",
    deliveryIn: "Παράδοση σε",
    customize: "Προσαρμογή",
    add: "Προσθήκη",
    outOfStock: "Εκτός αποθέματος",
    onlyLeft: "Μόνο",
    left: "απομένουν!",

    onlyMoreCanBeAdded: "Μόνο {count} ακόμη μπορούν να προστεθούν στο καλάθι",
    stockLabel: "Απόθεμα",
    inCartLabel: "Στο καλάθι",

    itemOutOfStockOrMaxQuantity: "Λυπάμαι, αυτό το προϊόν είναι εκτός αποθέματος ή ήδη στη μέγιστη ποσότητα στο καλάθι σας",

    
    // Order Details
    orderDetails: "Λεπτομέρειες Παραγγελίας",
    delivery: "Παράδοση",
    pickup: "Παραλαβή",
    dineIn: "Στο εστιατόριο",
    
    // Form Fields
    name: "Όνομα",
    whatsappNumber: "Αριθμός WhatsApp",
    phone: "Τηλέφωνο",
    email: "Email",
    notes: "Σημειώσεις",
    addressLine1: "Διεύθυνση Γραμμή 1",
    addressLine2: "Διεύθυνση Γραμμή 2",
    deliveryTime: "Ώρα Παράδοσης",
    pickupTime: "Ώρα Παραλαβής",
    arrivalTime: "Ώρα Άφιξης",
    asap: "Όσο πιο γρήγορα",
    mins: "λεπτά",
    
    // Cart & Checkout
    cartItems: "Προϊόντα στο Καλάθι",
    productsInCart: "Προϊόντα στο Καλάθι", // For RETAIL businesses
    subtotal: "Υποσύνολο",
    deliveryFee: "Κόστος Παράδοσης",
    total: "Σύνολο",
    minimumOrder: "Η ελάχιστη παραγγελία είναι",
    forDelivery: "για παράδοση. Προσθέστε ",
    moreTo: "περισσότερα για να ολοκληρώσετε την παραγγελία σας.",
    specialInstructions: "Ειδικές Οδηγίες",
    anySpecialRequests: "Οποιεσδήποτε ειδικές αιτήσεις...",
    orderViaWhatsapp: "Παραγγελία μέσω WhatsApp",
    placingOrder: "Δημιουργία Παραγγελίας...",
    clickingButton: "Κάνοντας κλικ σε αυτό το κουμπί θα ανοίξει το WhatsApp με τις λεπτομέρειες της παραγγελίας σας",
    yourOrder: "Η Παραγγελία σας",
    moreToProceed: "περισσότερα για να ολοκληρώσετε την παραγγελία σας.",

    sorryOnlyStockAvailable: "Λυπάμαι, μόνο {count} {itemWord} διαθέσιμα σε απόθεμα",

    
    // Product Modal
    chooseSize: "Επιλέξτε Επιλογή",
    addExtras: "Προσθήκη Επιπλέον",
    required: "(Υποχρεωτικό)",
    quantity: "Ποσότητα",
    addToCart: "Προσθήκη στο Καλάθι",
    youSave: "Εξοικονομείτε",
    perItem: "ανά είδος",
    originalSubtotal: "Αρχικό Υποσύνολο",
    discount: "Έκπτωση",
    

    website: "Ιστοσελίδα",
    yourFullName: "Το πλήρες όνομά σας",
    emailPlaceholder: "το.email@παράδειγμα.com",
    linkCopied: "Ο σύνδεσμος αντιγράφηκε στο πρόχειρο!",
    moreSharingOptions: "Περισσότερες επιλογές κοινοποίησης",

    // Greek translations:
    now: "Τώρα",
    schedule: "Προγραμματισμός",
    selectDate: "Επιλέξτε Ημερομηνία",
    selectTime: "Επιλέξτε Ώρα",
    today: "Σήμερα",
    tomorrow: "Αύριο",
    noTimeSlots: "Δεν υπάρχουν διαθέσιμες ώρες για αυτή την ημερομηνία",
    address: "Διεύθυνση",
    pickupLocation: "Τοποθεσία Παραλαβής",
    directions: "Οδηγίες",
    tapForDirections: "Πατήστε για οδηγίες",
    pickupInstructions: "Παρακαλώ ελάτε σε αυτή την τοποθεσία για να παραλάβετε την παραγγελία σας.",
    mapView: "Προβολή Χάρτη",
    businessInfo: "Πληροφορίες Επιχείρησης",
    about: "Σχετικά",
    contact: "Επικοινωνία",
    hours: "Ώρες",
    serviceOptions: "Επιλογές Υπηρεσίας",
    share: "Κοινοποίηση",
    copyLink: "Αντιγραφή Συνδέσμου",
    shareVia: "Κοινοποίηση μέσω",
    temporarilyClosed: "Προσωρινά Κλειστό",
    expectedReopen: "Αναμένεται να ανοίξει",
    storeTemporarilyClosed: "Το Κατάστημα είναι Προσωρινά Κλειστό",
    storeClosedMessage: "Ζητούμε συγγνώμη για οποιαδήποτε αναστάτωση.",
    time: "Ώρα",
    serviceFee: "Χρέωση Υπηρεσίας",
    popular: "Δημοφιλές",
    
    noResultsFor: 'Δεν υπάρχουν αποτελέσματα για',
    result: 'αποτέλεσμα',
    results: 'αποτελέσματα',
    for: 'για',

    // Placeholders
    streetAddress: "Οδός",
    apartment: "Διαμέρισμα, σουίτα, κλπ.",
    selectCountry: "Επιλέξτε Χώρα",
    selectCountryFirst: "Επιλέξτε πρώτα τη χώρα",
    selectCity: "Επιλέξτε Πόλη",
    postalCode: "Ταχυδρομικός Κώδικας",
    postalCodePlaceholder: "Ταχυδρομικός κώδικας",
    
    // Phone Validation
    invalidAlbanianPhone: "Παρακαλώ εισάγετε έγκυρο αλβανικό αριθμό τηλεφώνου",
    invalidGreekPhone: "Παρακαλώ εισάγετε έγκυρο ελληνικό αριθμό τηλεφώνου",
    invalidItalianPhone: "Παρακαλώ εισάγετε έγκυρο ιταλικό αριθμό τηλεφώνου",
    invalidSpanishPhone: "Παρακαλώ εισάγετε έγκυρο ισπανικό αριθμό τηλεφώνου",
    invalidUSPhone: "Παρακαλώ εισάγετε έγκυρο αμερικανικό αριθμό τηλεφώνου",
    invalidKosovoPhone: "Παρακαλώ εισάγετε έγκυρο κοσοβιανό αριθμό τηλεφώνου",
    invalidNorthMacedoniaPhone: "Παρακαλώ εισάγετε έγκυρο μακεδονικό αριθμό τηλεφώνου",
    invalidPhone: "Παρακαλώ εισάγετε έγκυρο αριθμό τηλεφώνου",
    phoneFormatAlbania: "Μορφή: +355 68 123 4567",
    phoneFormatGreece: "Μορφή: +30 694 123 4567",
    phoneFormatItaly: "Μορφή: +39 34 3123 4567",
    phoneFormatSpain: "Μορφή: +34 612 345 678",
    phoneFormatKosovo: "Μορφή: +383 44 123 456",
    phoneFormatNorthMacedonia: "Μορφή: +389 70 123 456",
    phoneFormatUS: "Μορφή: +1 (555) 123-4567",
    phoneFormatGeneric: "Εισάγετε τον αριθμό WhatsApp σας με τον κωδικό χώρας",

    inCartAvailable: "{inCart} στο καλάθι, {available} διαθέσιμα",
    onlyStockAvailable: "Μόνο {stock} διαθέσιμα",
    
    // Footer
    poweredBy: "Με την υποστήριξη",
    
    // Legal Pages
    backTo: "Πίσω στο",
    legalPolicies: "Νομικά & Πολιτικές",
    legalPoliciesCta: "Όροι & Πολιτικές",
    legalPoliciesSubtitle: "Δείτε τους όρους, τις πολιτικές και τις νομικές πληροφορίες μας",
    noPagesAvailable: "Δεν υπάρχουν διαθέσιμες σελίδες",
    
    // Empty States
    noProductsFound: "Δεν βρέθηκαν προϊόντα",
    noProductsFoundDescription: "Δεν μπορέσαμε να βρούμε προϊόντα που να ταιριάζουν με την αναζήτησή σας. Δοκιμάστε να προσαρμόσετε τους όρους αναζήτησης.",
    noProductsInCategory: "Δεν υπάρχουν προϊόντα σε αυτή την κατηγορία",
    noProductsInCategoryDescription: "Αυτή η κατηγορία δεν έχει ακόμη προϊόντα. Ελέγξτε αργότερα ή περιηγηθείτε σε άλλες κατηγορίες.",
    tryDifferentSearch: "Δοκιμάστε μια διαφορετική αναζήτηση",
    browseAllProducts: "Περιηγηθείτε σε όλα τα προϊόντα",
    comingSoon: "Σύντομα!",
    checkBackLater: "Εργαζόμαστε για να προσθέσουμε προϊόντα σε αυτή την ενότητα. Παρακαλώ ελέγξτε αργότερα.",
    freeDelivery: "Δωρεάν Παράδοση",
    free: "Δωρεάν",
    addMoreForFreeDelivery: "Προσθέστε {amount} ακόμα για δωρεάν παράδοση!",
    pickupAvailable: "Διαθέσιμη Παραλαβή",
    // Closure Messages
    maintenanceMessage: "Εκτελούμε προσωρινά συντήρηση και θα επιστρέψουμε σύντομα.",
    holidayMessage: "Είμαστε κλειστά για τις διακοπές.",
    emergencyMessage: "Είμαστε προσωρινά κλειστά λόγω απρόβλεπτων συνθηκών.",
    staffShortageMessage: "Είμαστε προσωρινά κλειστά λόγω προβλημάτων προσωπικού.",
    supplyIssuesMessage: "Είμαστε προσωρινά κλειστά λόγω προβλημάτων προμήθειας.",
    temporaryClosureMessage: "Είμαστε προσωρινά κλειστά και θα ανοίξουμε σύντομα.",

     // Delivery Zone Errors
  outsideDeliveryArea: "Η διεύθυνση είναι εκτός της περιοχής παράδοσης",
  outsideDeliveryAreaDesc: "Δυστυχώς, δεν παραδίδουμε σε αυτή τη διεύθυνση. Η μέγιστη απόσταση παράδοσης είναι",
  deliveryNotAvailable: "Η παράδοση δεν είναι διαθέσιμη",
  deliveryCalculationFailed: "Αδυναμία υπολογισμού του κόστους παράδοσης",
  tryDifferentAddress: "Δοκιμάστε μια διαφορετική διεύθυνση",
  selectDifferentArea: "Παρακαλώ επιλέξτε μια διεύθυνση εντός της περιοχής παράδοσής μας",
  maxDeliveryDistance: "Μέγιστη απόσταση παράδοσης",
  failedToCreateOrder: "Αποτυχία δημιουργίας παραγγελίας. Παρακαλώ δοκιμάστε ξανά.",
  failedToSubmitOrder: "Αποτυχία υποβολής παραγγελίας. Παρακαλώ δοκιμάστε ξανά.",


  // Success Message & Scheduling
  orderPrepared: "Η Παραγγελία Στάλθηκε!",
  orderNumber: "Αριθμός Παραγγελίας",
  orderOpenedWhatsApp: "Η παραγγελία σας στάλθηκε με επιτυχία. Το κατάστημα έχει ειδοποιηθεί, αλλά μπορείτε επίσης να στείλετε ένα μήνυμα WhatsApp αν θέλετε να επικοινωνήσετε απευθείας με το κατάστημα.",
  nextSteps: "Τι Επόμενο;",
  sendWhatsAppMessage: "Προαιρετικό: Στείλτε μήνυμα WhatsApp για επικοινωνία με το κατάστημα",
  awaitConfirmation: "Θα λάβετε ενημερώσεις κατάστασης παραγγελίας μέσω email ή WhatsApp",
  weWillPrepareOrder: "Το κατάστημα θα επεξεργαστεί την παραγγελία σας και θα σας ειδοποιήσει για οποιαδήποτε αλλαγή κατάστασης",
  storeCurrentlyClosed: "Το κατάστημα είναι προσωρινά κλειστό",
  wouldYouLikeToSchedule: "Θα θέλατε να προγραμματίσετε την παραγγελία σας για αργότερα;",
  
  // Direct Notification (Twilio) Success Message
  orderSentDirect: "Η Παραγγελία Στάλθηκε με Επιτυχία!",
  orderSentDirectMessage: "Η παραγγελία σας στάλθηκε απευθείας στο κατάστημα μέσω WhatsApp. Έχουν λάβει όλες τις λεπτομέρειες της παραγγελίας σας και θα επικοινωνήσουν μαζί σας σύντομα.",
  directNextSteps: "Τι Γίνεται Τώρα;",
  directStep1: "Το κατάστημα έλαβε την παραγγελία σας",
  directStep2: "Θα ετοιμάσουν την παραγγελία σας",
  directStep3: "Θα επικοινωνήσουν μαζί σας για ενημερώσεις",
  youCanCloseThisPage: "Μπορείτε να κλείσετε αυτή τη σελίδα με ασφάλεια",

  cannotPlaceNowOrder: "Είμαστε προσωρινά κλειστά και δεν μπορούμε να δεχτούμε παραγγελίες για άμεση παράδοση/παραλαβή. Ωστόσο, μπορείτε να προγραμματίσετε την παραγγελία σας για όταν είμαστε ανοιχτά!",
  schedulingBenefits: "Γιατί να προγραμματίσετε την παραγγελία σας;",
  guaranteedPreparation: "Εγγυημένη προετοιμασία όταν είμαστε ανοιχτά",
  noWaitingTime: "Χωρίς αναμονή - έτοιμο όταν φτάσετε",
  secureYourOrder: "Κατασφαλίστε την προτιμώμενη ώρα σας",
  continueAnyway: "Συνέχεια Ούτως ή Άλλως",
  scheduleOrder: "Προγραμματισμός Παραγγελίας",
  close: "Κλείσιμο",
  selectTimeForSchedule: "Παρακαλώ επιλέξτε μια ώρα για την παραγγελία σας",
  addItemsToCart: "Προσθέστε προϊόντα στο καλάθι",
  fillRequiredInfo: "Συμπληρώστε τις απαιτούμενες πληροφορίες",
  addDeliveryAddress: "Προσθέστε διεύθυνση παράδοσης",

  // Address Autofill Detection
  addressAutofillWarning: "Παρακαλώ πληκτρολογήστε τη διεύθυνσή σας και επιλέξτε από τις προτάσεις για να επιβεβαιώσετε την τοποθεσία παράδοσης",
  confirmAddressAbove: "Παρακαλώ επιβεβαιώστε τη διεύθυνση παράδοσης παραπάνω",
  confirmDeliveryAddress: "Επιβεβαιώστε τη διεύθυνση παράδοσης",
  selectAddressFromSuggestions: "Παρακαλώ πληκτρολογήστε και επιλέξτε τη διεύθυνσή σας από τις προτάσεις",

  // NEW STOCK-RELATED TRANSLATIONS
  inCart: "στο καλάθι",
  inBooking: "σε κράτηση",
  inBookingPlural: "σε κράτηση",
  available: "διαθέσιμα",
  onlyAvailable: "Μόνο διαθέσιμα",
  item: "προϊόν",
  items: "προϊόντα",
  maximumQuantityInCart: "Μέγιστη ποσότητα ({count}) ήδη στο καλάθι",
  canBeAdded: "περισσότερα μπορούν να προστεθούν στο καλάθι",
    stock: "Απόθεμα",
    max: "Μέγ",
    loading: "Φόρτωση επιλογών...",
    loadingMore: "Φόρτωση περισσότερων προϊόντων...",
    retry: "Επανάληψη",
    loadingCountries: "Φόρτωση χωρών...",
    loadingCities: "Φόρτωση πόλεων...",
    selectDeliveryMethod: "Επιλέξτε τη μέθοδο παράδοσης παρακάτω",
    pleaseSelectDeliveryMethod: "Παρακαλώ επιλέξτε μια μέθοδο παράδοσης",
    enterAddressForDelivery: "Εισάγετε διεύθυνση για να δείτε τις επιλογές παράδοσης",
    deliveryMethod: "Μέθοδος Παράδοσης",
    noDeliveryOptions: "Δεν υπάρχουν επιλογές παράδοσης διαθέσιμες για αυτή την πόλη",
    
    // Filter
    filterProducts: "Φιλτράρισμα Προϊόντων",
    priceRange: "Εύρος Τιμής",
    minPrice: "Ελάχιστη Τιμή",
    maxPrice: "Μέγιστη Τιμή",
    noLimit: "Χωρίς όριο",
    categories: "Κατηγορίες",
    sortBy: "Ταξινόμηση",
    sortByNameAsc: "Όνομα (Α-Ω)",
    sortByNameDesc: "Όνομα (Ω-Α)",
    sortByPriceAsc: "Τιμή (Χαμηλή προς Υψηλή)",
    sortByPriceDesc: "Τιμή (Υψηλή προς Χαμηλή)",
    clearAll: "Καθαρισμός Όλων",
    applyFilters: "Εφαρμογή Φίλτρων",
    sort: "Ταξινόμηση",
    
    // Custom Filtering
    collections: "Συλλογές",
    groups: "Ομάδες",
    brands: "Μάρκες",
    
    // Product Loading
    tryAgain: "Δοκίμασε Ξανά",
    loadMore: "Φόρτωσε Περισσότερα",
    
    // Salon/Appointment specific
    bookAppointment: "Κράτηση Ραντεβού",
    selectedServices: "Επιλεγμένες Υπηρεσίες",
    appointmentDate: "Ημερομηνία Ραντεβού",
    appointmentTime: "Ώρα Ραντεβού",
    submitting: "Υποβολή...",
    bookViaWhatsapp: "Κράτηση μέσω WhatsApp",
    addToBooking: "Προσθήκη σε Κράτηση",
    specialRequests: "Ειδικές αιτήσεις...",
    
    // Invoice/Receipt Selection (for Greek storefronts)
    invoiceOrReceipt: "Τιμολόγιο ή Απόδειξη",
    invoiceOrReceiptQuestion: "Τιμολόγιο ή Απόδειξη? *",
    selectInvoiceOrReceipt: "Επιλέξτε αν χρειάζεστε τιμολόγιο ή απόδειξη για την παραγγελία σας",
    invoice: "Τιμολόγιο",
    receipt: "Απόδειξη",
    invoiceMinimumOrderError: "Για να επιλέξετε Τιμολόγιο, η παραγγελία σας πρέπει να είναι τουλάχιστον {amount}",
    invoiceMinimumOrderErrorWithCurrent: "Για να επιλέξετε Τιμολόγιο, η παραγγελία σας πρέπει να είναι τουλάχιστον {amount}. Τρέχουσα παραγγελία: {current}",
    invoiceNote: "Σημείωση: Θα επικοινωνήσουμε μαζί σας για να ζητήσουμε τυχόν επιπλέον στοιχεία που χρειάζονται για το Τιμολόγιο σας.",
    invoiceDetails: "Στοιχεία Τιμολογίου",
    taxId: "ΑΦΜ (Φορολογικός Αριθμός)",
    taxIdRequired: "ΑΦΜ (Φορολογικός Αριθμός) *",
    taxIdDigits: "9 ψηφία",
    taxIdDigitsCount: "9 ψηφία ({count}/9)",
    companyName: "Επωνυμία Εταιρείας",
    taxOffice: "ΔΟΥ (Δημόσια Οικονομική Υπηρεσία)",
    enterValidTaxId: "Παρακαλώ εισάγετε έγκυρο ΑΦΜ (9 ψηφία)"

  }

  export const getStorefrontTranslations = (language: string): StorefrontTranslations => {
    if (language === 'sq' || language === 'al') {
      return albanianTranslations
    } else if (language === 'es') {
      return spanishTranslations
    } else if (language === 'el' || language === 'gr') {
      return greekTranslations
    }
    return englishTranslations
  }