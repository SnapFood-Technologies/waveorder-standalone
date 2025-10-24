// src/app/superadmin/support/tickets/[ticketId]/page.tsx
import { SuperAdminTicketDetails } from '@/components/superadmin/support/SuperAdminTicketDetails'

interface TicketDetailsPageProps {
  params: Promise<{ ticketId: string }>
}

export default async function TicketDetailsPage({ params }: TicketDetailsPageProps) {
  const { ticketId } = await params
  return <SuperAdminTicketDetails ticketId={ticketId} />
}
