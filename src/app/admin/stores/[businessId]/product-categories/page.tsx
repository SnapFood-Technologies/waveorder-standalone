// app/admin/stores/[businessId]/categories/page.tsx
import CategoriesManagement  from '@/components/admin/categories/CategoriesManagement'

interface CategoriesPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ProductCategoriesPage({ params }: CategoriesPageProps) {
  const { businessId } = await params
  return <CategoriesManagement businessId={businessId} />
}
