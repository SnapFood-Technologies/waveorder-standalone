// app/admin/stores/[businessId]/service-categories/page.tsx
import CategoriesManagement from '@/components/admin/categories/CategoriesManagement'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'

interface ServiceCategoriesPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ServiceCategoriesPage({ params }: ServiceCategoriesPageProps) {
  const { businessId } = await params
  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['SALON', 'SERVICES']}
      redirectTo={`/admin/stores/${businessId}/product-categories`}
    >
      <CategoriesManagement businessId={businessId} forServiceCategories />
    </BusinessTypeGuard>
  )
}
