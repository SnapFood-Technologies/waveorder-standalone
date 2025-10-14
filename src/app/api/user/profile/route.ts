// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadUserAvatar } from '@/lib/userStorage'

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        emailVerified: true,
        pendingEmail: true,
        image: true,
        role: true,
        plan: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        name: user.name || '',
        email: user.email,
        emailVerified: !!user.emailVerified,
        pendingEmail: user.pendingEmail,
        image: user.image,
        role: user.role,
        plan: user.plan
      }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const image = formData.get('image') as File | null

    // Validate name
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'This email is already in use' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      email: email.toLowerCase().trim()
    }

    // If email changed, mark as unverified
    if (email !== session.user.email) {
      updateData.emailVerified = null
    }

    // Handle image upload
    if (image && image.size > 0) {
      try {
        const currentUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { image: true }
        })

        const uploadResult = await uploadUserAvatar(image, session.user.id, currentUser?.image || undefined)
        
        if (uploadResult.success && uploadResult.publicUrl) {
          updateData.image = uploadResult.publicUrl
        }
      } catch (error) {
        console.error('Image upload failed:', error)
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        plan: true
      }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name || '',
        email: updatedUser.email,
        emailVerified: !!updatedUser.emailVerified,
        image: updatedUser.image,
        role: updatedUser.role,
        plan: updatedUser.plan
      }
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}