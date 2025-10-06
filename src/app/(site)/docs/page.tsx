'use client'

import { RedocStandalone } from 'redoc'
import Head from 'next/head'

export default function DocsPage() {
  return (
    <>
      <Head>
        <title>API Documentation - WaveOrder (Internal)</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
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
    </>
  )
}