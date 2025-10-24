// src/app/admin/stores/[businessId]/support/tickets/page.tsx
import { TicketList } from '@/components/admin/support/TicketList'

interface TicketsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { businessId } = await params
  return <TicketList businessId={businessId} />
}
