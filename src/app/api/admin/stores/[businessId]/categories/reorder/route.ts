// app/api/admin/stores/[businessId]/categories/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const { categories } = await request.json()

    const updatePromises = categories.map((cat: { id: string; sortOrder: number }) =>
      prisma.category.update({
        where: { id: cat.id },
        data: { sortOrder: cat.sortOrder }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ message: 'Categories reordered successfully' })

  } catch (error) {
    console.error('Error reordering categories:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}