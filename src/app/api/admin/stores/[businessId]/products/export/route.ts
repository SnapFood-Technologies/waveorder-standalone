// app/api/admin/stores/[businessId]/products/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import Papa from 'papaparse'

const prisma = new PrismaClient()

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ businessId: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
  
      const { businessId } = await params
  
      const products = await prisma.product.findMany({
        where: {
          businessId,
          business: {
            users: {
              some: {
                user: {
                  email: session.user.email
                }
              }
            }
          }
        },
        include: {
          category: true
        }
      })
  
      const csvData = products.map(product => ({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category.name,
        stock: product.stock,
        sku: product.sku || '',
        active: product.isActive ? 'Yes' : 'No',
        featured: product.featured ? 'Yes' : 'No'
      }))
  
      const csv = Papa.unparse(csvData)
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="products.csv"'
        }
      })
  
    } catch (error) {
      console.error('Error exporting products:', error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
  }