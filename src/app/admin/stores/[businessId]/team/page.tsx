// src/app/admin/stores/[businessId]/team/page.tsx
import { TeamManagement } from '@/components/admin/team/TeamManagement'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { prisma } from '@/lib/prisma'

interface TeamManagementPageProps {
  params: Promise<{ businessId: string }>
}

export default async function TeamManagementPage({ params }: TeamManagementPageProps) {
  const { businessId } = await params

  // Allow access if BUSINESS plan OR SuperAdmin enabled manual team creation exception (e.g. PRO with team access)
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { enableManualTeamCreation: true },
  })
  const hasTeamException = business?.enableManualTeamCreation === true

  if (hasTeamException) {
    return <TeamManagement businessId={businessId} />
  }

  return (
    <SubscriptionGuard requiredPlan="BUSINESS">
      <TeamManagement businessId={businessId} />
    </SubscriptionGuard>
  )
}
