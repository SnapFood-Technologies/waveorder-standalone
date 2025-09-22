// app/admin/stores/[businessId]/settings/configurations/page.tsx
import { BusinessConfiguration } from '@/components/admin/settings/BusinessConfiguration'

interface ConfigurationsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ConfigurationsPage({ params }: ConfigurationsPageProps) {
  const { businessId } = await params
  return <BusinessConfiguration businessId={businessId} />
}
