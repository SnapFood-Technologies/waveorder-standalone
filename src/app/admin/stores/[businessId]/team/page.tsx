// src/app/admin/stores/[businessId]/team/page.tsx
import { TeamManagement } from '@/components/admin/team/TeamManagement'

interface TeamManagementPageProps {
  params: Promise<{ businessId: string }>
}

export default async function TeamManagementPage({ params }: TeamManagementPageProps) {
  const { businessId } = await params
  return <TeamManagement businessId={businessId} />
}
