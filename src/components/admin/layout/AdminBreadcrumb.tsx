// src/components/admin/layout/AdminBreadcrumb.tsx
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[]
}

export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />}
            {item.current ? (
              <span className="text-gray-500 font-medium">{item.label}</span>
            ) : (
              <Link 
                href={item.href}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}