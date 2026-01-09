import { LocationsConfigurations } from '@/components/superadmin/locations/LocationsConfigurations'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Locations Configurations - Super Admin',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LocationsConfigurationsPage() {
  return <LocationsConfigurations />
}
