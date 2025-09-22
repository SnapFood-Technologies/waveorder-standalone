// app/admin/stores/[businessId]/settings/business/page.tsx
import { BusinessSettingsForm } from '@/components/admin/settings/BusinessSettingsForm'

interface BusinessSettingsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function BusinessSettingsPage({ params }: BusinessSettingsPageProps) {
  const { businessId } = await params
  return <BusinessSettingsForm businessId={businessId} />
}