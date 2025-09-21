// app/admin/stores/[businessId]/marketing/page.tsx
import MarketingComponent  from '@/components/admin/marketing/MarketingManagement'

interface MarketingPageProps {
  params: Promise<{ businessId: string }>
}

export default async function MarketingPage({ params }: MarketingPageProps) {
  const { businessId } = await params
  return <MarketingComponent businessId={businessId} />
}