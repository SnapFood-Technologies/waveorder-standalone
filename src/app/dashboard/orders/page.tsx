import OrdersTable from '@/components/dashboard/OrdersTable'

export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <OrdersTable />
    </div>
  )
}
