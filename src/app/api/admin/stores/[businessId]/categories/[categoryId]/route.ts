// app/api/admin/stores/[businessId]/categories/[categoryId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ businessId: string; categoryId: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
  
      const { businessId, categoryId } = await params
  
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
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
          _count: {
            select: {
              products: true
            }
          }
        }
      })
  
      if (!category) {
        return NextResponse.json({ message: 'Category not found' }, { status: 404 })
      }
  
      return NextResponse.json({ category })
  
    } catch (error) {
      console.error('Error fetching category:', error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
  }
  
  export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ businessId: string; categoryId: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
  
      const { businessId, categoryId } = await params
      const categoryData = await request.json()
  
      const category = await prisma.category.updateMany({
        where: {
          id: categoryId,
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
        data: {
          name: categoryData.name,
          description: categoryData.description || null,
          image: categoryData.image || null,
          isActive: categoryData.isActive
        }
      })
  
      if (category.count === 0) {
        return NextResponse.json({ message: 'Category not found' }, { status: 404 })
      }
  
      // Fetch updated category with count
      const updatedCategory = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      })
  
      return NextResponse.json({ category: updatedCategory })
  
    } catch (error) {
      console.error('Error updating category:', error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
  }
  
  export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ businessId: string; categoryId: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
  
      const { businessId, categoryId } = await params
      const updates = await request.json()
  
      const category = await prisma.category.updateMany({
        where: {
          id: categoryId,
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
        data: updates
      })
  
      if (category.count === 0) {
        return NextResponse.json({ message: 'Category not found' }, { status: 404 })
      }
  
      return NextResponse.json({ message: 'Category updated successfully' })
  
    } catch (error) {
      console.error('Error updating category:', error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
  }
  
  export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ businessId: string; categoryId: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
  
      const { businessId, categoryId } = await params
  
      // Check if category exists and get product count
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
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
          _count: {
            select: {
              products: true
            }
          }
        }
      })
  
      if (!category) {
        return NextResponse.json({ message: 'Category not found' }, { status: 404 })
      }
  
      // Delete category (this will cascade delete products due to foreign key)
      await prisma.category.delete({
        where: { id: categoryId }
      })
  
      return NextResponse.json({ 
        message: 'Category deleted successfully',
        deletedProducts: category._count.products
      })
  
    } catch (error) {
      console.error('Error deleting category:', error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
  }
  