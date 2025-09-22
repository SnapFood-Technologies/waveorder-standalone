// app/admin/stores/[businessId]/inventory/activities/page.tsx
import InventoryActivitiesComponent from '@/components/admin/inventory/InventoryActivitiesComponent'

interface InventoryActivitiesPageProps {
  params: Promise<{ businessId: string }>
}

export default async function InventoryActivitiesPage({ params }: InventoryActivitiesPageProps) {
  const { businessId } = await params
  return <InventoryActivitiesComponent businessId={businessId} />
}