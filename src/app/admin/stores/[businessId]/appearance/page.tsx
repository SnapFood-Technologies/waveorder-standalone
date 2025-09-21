// src/app/admin/stores/[businessId]/appearance/page.tsx
import { StoreAppearance } from '@/components/admin/appearance/StoreAppearance'

interface AppearancePageProps {
  params: Promise<{ businessId: string }>
}

export default async function AppearancePage({ params }: AppearancePageProps) {
  const { businessId } = await params
  return <StoreAppearance businessId={businessId} />
}