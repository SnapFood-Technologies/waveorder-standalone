// src/app/admin/stores/[businessId]/settings/profile/page.tsx
import UserProfileForm from '@/components/admin/profile/UserProfileForm'

export const metadata = {
  title: 'Account Settings - WaveOrder',
  description: 'Manage your account settings and profile information'
}

export default function ProfileSettingsPage() {
  return <UserProfileForm />
}