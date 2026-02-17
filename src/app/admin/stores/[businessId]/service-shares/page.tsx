import ServiceSharesAnalytics from '@/components/admin/analytics/ServiceSharesAnalytics'

interface PageProps {
  params: Promise<{ businessId: string }>
}

export default async function ServiceSharesPage({ params }: PageProps) {
  const { businessId } = await params
  return <ServiceSharesAnalytics businessId={businessId} />
}
