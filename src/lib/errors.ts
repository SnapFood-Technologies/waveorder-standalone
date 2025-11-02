// lib/errors.ts
// Custom exception classes for better error tracking and handling

import * as Sentry from '@sentry/nextjs'

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.context = context

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, context)
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 401, 'AUTHENTICATION_ERROR', true, context)
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: Record<string, any>) {
    super(message, 403, 'AUTHORIZATION_ERROR', true, context)
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} not found`, 404, 'NOT_FOUND', true, { resource, ...context })
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, 'CONFLICT_ERROR', true, context)
  }
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', retryAfter?: number, context?: Record<string, any>) {
    super(message, 429, 'RATE_LIMIT_ERROR', true, { retryAfter, ...context })
  }
}

/**
 * Business logic errors (400)
 */
export class BusinessError extends AppError {
  constructor(message: string, code?: string, context?: Record<string, any>) {
    super(message, 400, code || 'BUSINESS_ERROR', true, context)
  }
}

/**
 * Database errors (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', originalError?: Error, context?: Record<string, any>) {
    super(message, 500, 'DATABASE_ERROR', false, { 
      originalError: originalError?.message, 
      ...context 
    })
  }
}

/**
 * External service errors (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service error', context?: Record<string, any>) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', false, { service, ...context })
  }
}

/**
 * Error handler utility
 */
export interface ErrorResponse {
  error: string
  code: string
  statusCode: number
  details?: any
  requestId?: string
}

export function handleError(error: unknown, context?: Record<string, any>): ErrorResponse {
  // Handle known AppError instances
  if (error instanceof AppError) {
    // Log operational errors to Sentry with context
    if (!error.isOperational || error.statusCode >= 500) {
      Sentry.captureException(error, {
        tags: {
          errorCode: error.code,
          statusCode: error.statusCode,
          isOperational: error.isOperational.toString(),
        },
        extra: {
          ...error.context,
          ...context,
        },
      })
    }

    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.context,
    }
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Check for Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any
      
      // Unique constraint violation
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0] || 'field'
        const conflictError = new ConflictError(
          `${field} already exists`,
          { field, prismaCode: prismaError.code }
        )
        return handleError(conflictError, context)
      }

      // Record not found
      if (prismaError.code === 'P2025') {
        const notFoundError = new NotFoundError('Resource', { prismaCode: prismaError.code })
        return handleError(notFoundError, context)
      }

      // Database error
      const dbError = new DatabaseError('Database operation failed', error, {
        prismaCode: prismaError.code,
        ...context,
      })
      return handleError(dbError, context)
    }

    // Generic Error - capture to Sentry
    Sentry.captureException(error, {
      extra: {
        ...context,
        errorMessage: error.message,
        errorName: error.name,
      },
    })

    return {
      error: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    }
  }

  // Unknown error type - capture to Sentry
  Sentry.captureException(new Error(String(error)), {
    extra: {
      ...context,
      unknownError: error,
    },
  })

  return {
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  }
}

/**
 * Wrap async API route handlers with error handling
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      const errorResponse = handleError(error, {
        route: args[0]?.url || 'unknown',
        method: args[0]?.method || 'unknown',
      })

      return new Response(
        JSON.stringify({
          ...errorResponse,
          ...(process.env.NODE_ENV === 'development' && {
            stack: error instanceof Error ? error.stack : undefined,
          }),
        }),
        {
          status: errorResponse.statusCode,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
  }
}

