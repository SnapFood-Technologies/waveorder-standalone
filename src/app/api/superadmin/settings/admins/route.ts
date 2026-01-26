// app/api/superadmin/settings/admins/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all super admin users
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      include: {
        accounts: {
          select: {
            provider: true,
            type: true
          }
        },
        businesses: {
          select: {
            businessId: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Format response with auth method detection
    const formattedAdmins = superAdmins.map(admin => {
      // Determine auth method
      let authMethod: 'google' | 'email' | 'magic-link' | 'oauth' = 'email'
      
      if (admin.accounts?.length > 0) {
        const googleAccount = admin.accounts.find(acc => acc.provider === 'google')
        if (googleAccount) {
          authMethod = 'google'
        } else {
          authMethod = 'oauth'
        }
      } else if (admin.password) {
        authMethod = 'email'
      } else {
        authMethod = 'magic-link'
      }

      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        authMethod,
        createdAt: admin.createdAt,
        businessCount: admin.businesses.length
      }
    })

    return NextResponse.json({
      admins: formattedAdmins
    })

  } catch (error) {
    console.error('Error fetching super admins:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
  }
}