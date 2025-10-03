// lib/api-helpers.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AccessResult {
  authorized: boolean
  error?: string
  status?: number
  session?: any
  isImpersonating?: boolean
}

export async function checkBusinessAccess(businessId: string): Promise<AccessResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { authorized: false, error: 'Unauthorized', status: 401 }
  }

  // Check for SuperAdmin impersonation
  const cookieStore = cookies()
  // @ts-ignore
  const impersonatingCookie = cookieStore.get('impersonating')
  const isImpersonating = 
    session.user.role === 'SUPER_ADMIN' && 
    impersonatingCookie?.value === businessId

  if (isImpersonating) {
    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    })
    
    if (!business) {
      return { authorized: false, error: 'Business not found', status: 404 }
    }
    
    return { authorized: true, session, isImpersonating: true }
  }

  // Normal access check - verify user has access to this business
  const businessUser = await prisma.businessUser.findFirst({
    where: {
      businessId: businessId,
      userId: session.user.id
    }
  })

  if (!businessUser) {
    return { authorized: false, error: 'Access denied', status: 403 }
  }

  return { authorized: true, session, isImpersonating: false }
}