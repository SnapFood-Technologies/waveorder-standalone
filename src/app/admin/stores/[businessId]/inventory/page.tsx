
// app/admin/stores/[businessId]/inventory/page.tsx
import InventoryDashboard from '@/components/admin/inventory/InventoryDashboard'

interface InventoryPageProps {
  params: Promise<{ businessId: string }>
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { businessId } = await params
  return <InventoryDashboard businessId={businessId} />
}
