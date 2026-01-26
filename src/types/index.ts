export interface Business {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  whatsappNumber: string
  businessType: string
  primaryColor: string
  secondaryColor: string
  currency: string
}

export interface Product {
  id: string
  name: string
  description?: string
  images: string[]
  price: number
  originalPrice?: number
  categoryId: string
  variants?: ProductVariant[]
  modifiers?: ProductModifier[]
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  metadata?: any // For variant-specific data like images
  originalPrice?: number
  sku?: string
  saleStartDate?: Date | string | null
  saleEndDate?: Date | string | null
}

export interface ProductModifier {
  id: string
  name: string
  price: number
  required: boolean
}

export interface Category {
  id: string
  name: string
  nameAl?: string
  description?: string
  descriptionAl?: string
  parentId?: string
  parent?: {
    id: string
    name: string
    nameAl?: string
    hideParentInStorefront?: boolean
  }
  children?: Array<{
    id: string
    name: string
    nameAl?: string
    description?: string
    descriptionAl?: string
    image?: string
    sortOrder: number
  }>
  hideParentInStorefront?: boolean
  image?: string
  sortOrder?: number
  products: Product[]
}

export interface Order {
  id: string
  orderNumber: string
  status: string
  type: string
  customer: Customer
  items: OrderItem[]
  total: number
  createdAt: Date
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
}

export interface OrderItem {
  id: string
  product: Product
  variant?: ProductVariant
  quantity: number
  price: number
  originalPrice?: number | null
  modifiers: string[]
}
