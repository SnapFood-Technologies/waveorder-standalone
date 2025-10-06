'use client'

import { RedocStandalone } from 'redoc'

export default function DocsViewPage() {
  return (
    <RedocStandalone
      specUrl="/api/openapi"
      options={{
        theme: {
          colors: {
            primary: { main: '#0D9488' }
          }
        },
        hideDownloadButton: false,
      }}
    />
  )
}