// app/admin/stores/[businessId]/services/page.tsx
import ServicesManagement from '@/components/admin/services/ServicesManagement'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'

interface ServicesPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { businessId } = await params
  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['SALON', 'SERVICES']}
      redirectTo={`/admin/stores/${businessId}/products`}
    >
      <ServicesManagement businessId={businessId} />
    </BusinessTypeGuard>
  )
}
