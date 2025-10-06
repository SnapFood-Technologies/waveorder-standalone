import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({
    // @ts-ignore
  spec: {
    url: '/api/openapi',
  },
  theme: 'purple',
  darkMode: false,
  pageTitle: 'WaveOrder API Documentation',
})