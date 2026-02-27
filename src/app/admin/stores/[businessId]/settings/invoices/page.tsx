// app/admin/stores/[businessId]/settings/invoices/page.tsx
import { InvoicesSettings } from '@/components/admin/settings/InvoicesSettings'

interface InvoicesSettingsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function InvoicesSettingsPage({ params }: InvoicesSettingsPageProps) {
  const { businessId } = await params
  return <InvoicesSettings businessId={businessId} />
}
