import { HolaOraSettings } from '@/components/admin/settings/HolaOraSettings'

interface PageProps {
  params: Promise<{ businessId: string }>
}

export default async function HolaOraSettingsPage({ params }: PageProps) {
  const { businessId } = await params
  return <HolaOraSettings businessId={businessId} />
}
