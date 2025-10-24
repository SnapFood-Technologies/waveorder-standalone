// src/app/admin/stores/[businessId]/help/page.tsx
import { HelpCenter } from '@/components/admin/help/HelpCenter'

interface HelpPageProps {
  params: Promise<{ businessId: string }>
}

export default async function HelpPage({ params }: HelpPageProps) {
  const { businessId } = await params
  return <HelpCenter businessId={businessId} />
}
