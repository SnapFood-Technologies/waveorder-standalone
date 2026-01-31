// src/app/admin/unified/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Multi-Store Overview | WaveOrder',
  description: 'View and manage all your stores in one place'
}

export default function UnifiedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
