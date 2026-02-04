// app/admin/stores/[businessId]/settings/happy-hour/page.tsx
import { HappyHourSettings } from '@/components/admin/settings/HappyHourSettings'

interface HappyHourSettingsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function HappyHourSettingsPage({ params }: HappyHourSettingsPageProps) {
  const { businessId } = await params
  return <HappyHourSettings businessId={businessId} />
}
