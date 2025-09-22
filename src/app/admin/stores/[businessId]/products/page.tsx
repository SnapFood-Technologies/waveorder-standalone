// app/admin/stores/[businessId]/products/page.tsx
import ProductsManagement  from '@/components/admin/products/ProductsManagement'

interface ProductsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { businessId } = await params
  return <ProductsManagement businessId={businessId} />
}