import EmbeddedMarketingManagement from '@/components/admin/marketing/EmbeddedMarketingManagement'

interface EmbeddedMarketingPageProps {
  params: Promise<{ businessId: string }>
}

export default async function EmbeddedMarketingPage({ params }: EmbeddedMarketingPageProps) {
  const { businessId } = await params
  return <EmbeddedMarketingManagement businessId={businessId} />
}
