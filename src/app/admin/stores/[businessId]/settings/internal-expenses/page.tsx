// app/admin/stores/[businessId]/settings/internal-expenses/page.tsx
// Redirect to Financial page (Internal Expenses moved to Financial)
import { redirect } from 'next/navigation'

interface InternalExpensesPageProps {
  params: Promise<{ businessId: string }>
}

export default async function InternalExpensesPage({ params }: InternalExpensesPageProps) {
  const { businessId } = await params
  redirect(`/admin/stores/${businessId}/financial`)
}
