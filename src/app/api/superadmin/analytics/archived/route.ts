// app/api/superadmin/analytics/archived/route.ts
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

    // Exclude test businesses from archived analytics
    // Use NOT to handle null/missing testMode field (existing businesses before this field was added)
    const excludeTestCondition = { NOT: { testMode: true } }

    // Fetch incomplete and inactive businesses (excluding test businesses)
    // Use BusinessUser relation with OWNER role to get the owner's email
    const [allBusinesses, inactiveBusinesses] = await Promise.all([
      // Fetch active businesses for incomplete check (excluding test and deactivated)
      prisma.business.findMany({
        where: {
          isActive: true,
          ...excludeTestCondition
        },
        select: {
          id: true,
          name: true,
          whatsappNumber: true,
          address: true,
          createdAt: true,
          users: {
            where: { role: 'OWNER' },
            select: {
              user: {
                select: { email: true }
              }
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Inactive businesses with deactivation info (excluding test)
      prisma.business.findMany({
        where: {
          isActive: false,
          ...excludeTestCondition
        },
        select: {
          id: true,
          name: true,
          deactivatedAt: true,
          deactivationReason: true,
          createdAt: true,
          users: {
            where: { role: 'OWNER' },
            select: {
              user: {
                select: { email: true }
              }
            },
            take: 1
          }
        },
        orderBy: {
          deactivatedAt: 'desc'
        }
      })
    ])

    // Filter incomplete businesses in memory (due to Prisma/MongoDB null handling issues)
    const incompleteBusinessesFiltered = allBusinesses.filter(business => {
      const whatsappNumber = (business.whatsappNumber || '').trim()
      const address = business.address ? business.address.trim() : null
      
      const hasWhatsApp = whatsappNumber !== '' && whatsappNumber !== 'Not provided'
      const hasAddress = address !== null && address !== '' && address !== 'Not set'
      
      return !hasWhatsApp || !hasAddress
    })

    // Format incomplete businesses
    const formattedIncompleteBusinesses = incompleteBusinessesFiltered.map(business => {
      const whatsappNumber = (business.whatsappNumber || '').trim()
      const address = business.address ? business.address.trim() : null
      
      const missingFields: string[] = []
      
      if (!whatsappNumber || whatsappNumber === 'Not provided' || whatsappNumber === '') {
        missingFields.push('WhatsApp')
      }
      
      if (!address || address === 'Not set' || address === '') {
        missingFields.push('Address')
      }

      // Extract owner email from BusinessUser -> User relation
      const ownerEmail = business.users[0]?.user?.email || null
      
      return {
        id: business.id,
        name: business.name,
        email: ownerEmail,
        missingFields,
        createdAt: business.createdAt.toISOString()
      }
    })

    // Format inactive businesses
    const formattedInactiveBusinesses = inactiveBusinesses.map(business => {
      // Extract owner email from BusinessUser -> User relation
      const ownerEmail = business.users[0]?.user?.email || null

      return {
        id: business.id,
        name: business.name,
        email: ownerEmail,
        deactivatedAt: business.deactivatedAt?.toISOString() || null,
        deactivationReason: business.deactivationReason || null,
        createdAt: business.createdAt.toISOString()
      }
    })

    return NextResponse.json({
      incompleteBusinesses: formattedIncompleteBusinesses,
      inactiveBusinesses: formattedInactiveBusinesses
    })

  } catch (error) {
    console.error('Error fetching archived data:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
