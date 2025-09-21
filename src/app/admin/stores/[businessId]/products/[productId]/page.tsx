// app/admin/stores/[businessId]/products/[productId]/page.tsx
import { ProductForm } from '@/components/admin/products/ProductForm'

interface ProductFormPageProps {
  params: Promise<{ businessId: string; productId: string }>
}

export default async function ProductFormPage({ params }: ProductFormPageProps) {
  const { businessId, productId } = await params
  return <ProductForm businessId={businessId} productId={productId} />
}
