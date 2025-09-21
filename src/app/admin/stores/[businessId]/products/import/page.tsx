// app/admin/stores/[businessId]/products/import/page.tsx
import ProductImport  from '@/components/admin/products/ProductImport'

interface ProductImportPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ProductImportPage({ params }: ProductImportPageProps) {
  const { businessId } = await params
  return <ProductImport businessId={businessId} />
}