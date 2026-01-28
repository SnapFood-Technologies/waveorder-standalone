// app/admin/stores/layout.tsx
'use client'

import { usePathname } from 'next/navigation'

export default function StoresLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // If we're at /admin/stores (the stores list), render without the full admin layout
  // The individual store pages will use their own layout with [businessId]
  if (pathname === '/admin/stores') {
    return <>{children}</>
  }
  
  // For other routes under /admin/stores (like /admin/stores/[businessId]/*),
  // let their own layout handle them
  return <>{children}</>
}
