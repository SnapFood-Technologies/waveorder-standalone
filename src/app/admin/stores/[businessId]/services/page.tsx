// app/admin/stores/[businessId]/services/page.tsx
import ServicesManagement from '@/components/admin/services/ServicesManagement'

interface ServicesPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { businessId } = await params
  return <ServicesManagement businessId={businessId} />
}
