import { SuperAdminUserDetails } from '@/components/superadmin/SuperAdminUserDetails'

export default async function UserDetailPage({ 
  params 
}: { 
  params: Promise<{ userId: string }> 
}) {
  const { userId } = await params
  return <SuperAdminUserDetails userId={userId} />
}
