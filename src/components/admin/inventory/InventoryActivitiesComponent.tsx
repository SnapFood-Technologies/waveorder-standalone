// src/components/admin/inventory/InventoryActivitiesPage.tsx
'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { InventoryActivity } from './InventoryActivity'

interface InventoryActivitiesPageProps {
  businessId: string
}

export default function InventoryActivitiesComponent({ businessId }: InventoryActivitiesPageProps) {
  return (
    <div className="space-y-6">
      {/* Activities Component */}
      <InventoryActivity businessId={businessId} />
    </div>
  )
}