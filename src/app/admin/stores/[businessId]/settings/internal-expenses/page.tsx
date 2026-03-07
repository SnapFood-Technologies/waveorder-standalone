// app/admin/stores/[businessId]/settings/internal-expenses/page.tsx
import { InternalExpensesSettings } from '@/components/admin/settings/InternalExpensesSettings'

interface InternalExpensesPageProps {
  params: Promise<{ businessId: string }>
}

export default async function InternalExpensesPage({ params }: InternalExpensesPageProps) {
  const { businessId } = await params
  return <InternalExpensesSettings businessId={businessId} />
}
