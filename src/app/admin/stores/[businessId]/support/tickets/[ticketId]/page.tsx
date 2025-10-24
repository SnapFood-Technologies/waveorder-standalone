// src/app/admin/stores/[businessId]/support/tickets/[ticketId]/page.tsx
import { TicketDetails } from '@/components/admin/support/TicketDetails'

interface TicketDetailsPageProps {
  params: Promise<{ businessId: string; ticketId: string }>
}

export default async function TicketDetailsPage({ params }: TicketDetailsPageProps) {
  const { businessId, ticketId } = await params
  return <TicketDetails businessId={businessId} ticketId={ticketId} />
}
