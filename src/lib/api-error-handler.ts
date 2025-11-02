// lib/api-error-handler.ts
// Next.js API route error handler with Sentry integration

import { NextResponse } from 'next/server'
import { handleError, ErrorResponse } from './errors'
import * as Sentry from '@sentry/nextjs'

/**
 * Handle errors in Next.js API routes and return formatted responses
 */
export function handleApiError(error: unknown, context?: Record<string, any>): NextResponse {
  const errorResponse = handleError(error, context)

  return NextResponse.json(
    {
      error: errorResponse.error,
      code: errorResponse.code,
      ...(errorResponse.details && { details: errorResponse.details }),
      ...(process.env.NODE_ENV === 'development' && error instanceof Error && {
        stack: error.stack,
      }),
    },
    { status: errorResponse.statusCode }
  )
}

/**
 * Wrap API route handler with error handling
 */
export function withApiErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      const request = args[0]
      return handleApiError(error, {
        url: request?.url,
        method: request?.method,
        pathname: new URL(request?.url || '').pathname,
      })
    }
  }
}

/**
 * Add Sentry context to current scope
 */
export function setSentryContext(context: Record<string, any>) {
  Sentry.setContext('request', context)
}

/**
 * Add Sentry tags
 */
export function setSentryTags(tags: Record<string, string>) {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value)
  })
}

/**
 * Add Sentry user context
 */
export function setSentryUser(user: {
  id?: string
  email?: string
  username?: string
  [key: string]: any
}) {
  Sentry.setUser(user)
}

