import ProductSharesAnalytics from '@/components/admin/analytics/ProductSharesAnalytics'

interface PageProps {
  params: Promise<{ businessId: string }>
}

export default async function ProductSharesPage({ params }: PageProps) {
  const { businessId } = await params
  return <ProductSharesAnalytics businessId={businessId} />
}
