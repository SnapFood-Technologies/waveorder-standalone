// src/lib/userStorage.ts
import { supabase } from './supabase'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { validateImageFile } from '@/lib/fileValidation'

export interface UserImageUploadResult {
  success: boolean
  publicUrl?: string
  error?: string
  filename?: string
}

export async function uploadUserAvatar(
  file: File, 
  userId: string,
  oldAvatarUrl?: string
): Promise<UserImageUploadResult> {
  try {
    const validation = await validateImageFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Process image - resize to 400x400 for avatars
    const processedBuffer = await sharp(buffer)
      .resize({
        width: 400,
        height: 400,
        fit: 'cover', // Crop to fit
        position: 'center'
      })
      .png({ quality: 90, compressionLevel: 6 })
      .toBuffer()

    const filename = `${userId}-avatar-${randomUUID()}.png`
    const filePath = `users/${userId}/avatar/${filename}`

    // Delete old avatar if exists
    if (oldAvatarUrl) {
      try {
        const oldPath = extractPathFromUrl(oldAvatarUrl)
        if (oldPath) {
          await supabase.storage
            .from('waveorder-images')
            .remove([oldPath])
        }
      } catch (error) {
        console.warn('Failed to delete old avatar:', error)
      }
    }

    // Upload new avatar
    const { data, error } = await supabase.storage
      .from('waveorder-images')
      .upload(filePath, processedBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return { success: false, error: 'Failed to upload avatar.' }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('waveorder-images')
      .getPublicUrl(filePath)

    return { 
      success: true, 
      publicUrl: urlData.publicUrl,
      filename: filename
    }

  } catch (error) {
    console.error('Avatar upload error:', error)
    return { success: false, error: 'Failed to upload avatar.' }
  }
}

function extractPathFromUrl(url: string): string | null {
  try {
    const urlParts = url.split('/waveorder-images/')
    return urlParts[1] || null
  } catch {
    return null
  }
}