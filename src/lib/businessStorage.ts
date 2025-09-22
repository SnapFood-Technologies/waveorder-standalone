// lib/businessStorage.ts
import { supabase } from './supabase';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { validateImageFile } from '@/lib/fileValidation';

export interface BusinessImageUploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  filename?: string;
}

export async function uploadBusinessImage(
  file: File, 
  businessId: string,
  folder: 'logo' | 'cover' | 'favicon' | 'ogImage',
  oldImageUrl?: string
): Promise<BusinessImageUploadResult> {
  try {
    // Validate file first
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Process image based on type
    const buffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer: Buffer;
    let contentType = 'image/jpeg';
    let fileExtension = 'jpg';

    switch (folder) {
      case 'logo':
        processedBuffer = await sharp(buffer)
          .resize({
            width: 400,
            height: 400,
            fit: 'inside',
            withoutEnlargement: true
          })
          .png({ quality: 90, compressionLevel: 6 })
          .toBuffer();
        contentType = 'image/png';
        fileExtension = 'png';
        break;

      case 'cover':
        processedBuffer = await sharp(buffer)
          .resize({
            width: 1200,
            height: 600,
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
        break;

      case 'favicon':
        processedBuffer = await sharp(buffer)
          .resize({
            width: 32,
            height: 32,
            fit: 'cover'
          })
          .png({ quality: 100 })
          .toBuffer();
        contentType = 'image/png';
        fileExtension = 'png';
        break;

      case 'ogImage':
        processedBuffer = await sharp(buffer)
          .resize({
            width: 1200,
            height: 630,
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 90, progressive: true })
          .toBuffer();
        break;

      default:
        processedBuffer = await sharp(buffer)
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
    }

    // Generate secure filename
    const filename = `${businessId}-${folder}-${randomUUID()}.${fileExtension}`;
    const filePath = `businesses/${businessId}/${folder}/${filename}`;

    // Delete old image if exists
    if (oldImageUrl) {
      try {
        const oldPath = extractPathFromUrl(oldImageUrl);
        if (oldPath) {
          await supabase.storage
            .from('waveorder-images')
            .remove([oldPath]);
        }
      } catch (error) {
        console.warn('Failed to delete old image:', error);
      }
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('waveorder-images')
      .upload(filePath, processedBuffer, {
        contentType,
        cacheControl: '31536000', // 1 year
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: `Failed to upload ${folder}.` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('waveorder-images')
      .getPublicUrl(filePath);

    return { 
      success: true, 
      publicUrl: urlData.publicUrl,
      filename: filename
    };

  } catch (error) {
    console.error(`${folder} upload error:`, error);
    return { success: false, error: `Failed to upload ${folder}.` };
  }
}

function extractPathFromUrl(url: string): string | null {
  try {
    // Extract path from Supabase public URL
    const urlParts = url.split('/waveorder-images/');
    return urlParts[1] || null;
  } catch {
    return null;
  }
}