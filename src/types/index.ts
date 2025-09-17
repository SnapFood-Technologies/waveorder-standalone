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
  description?: string
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
  modifiers: string[]
}
