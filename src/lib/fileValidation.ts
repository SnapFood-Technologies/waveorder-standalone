// lib/fileValidation.ts
import sharp from 'sharp';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateImageFile(file: File): Promise<FileValidationResult> {
  // Check file size (10MB max for business images)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    return { 
      valid: false, 
      error: `Image is too large (${fileSizeMB}MB). Maximum size is 10MB.` 
    };
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'image/svg+xml'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'unknown';
    return { 
      valid: false, 
      error: `${fileExt} files are not supported. Please use JPEG, PNG, WebP, GIF, or SVG.` 
    };
  }

  // For SVG files, skip sharp validation
  if (file.type === 'image/svg+xml') {
    // Basic SVG validation
    try {
      const text = await file.text();
      if (!text.includes('<svg') || !text.includes('</svg>')) {
        return { valid: false, error: 'Invalid SVG file' };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Unable to read SVG file' };
    }
  }

  // Validate other image formats with sharp
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      return { valid: false, error: 'Could not read image dimensions. The file may be corrupted.' };
    }

    // Check minimum dimensions
    if (metadata.width < 16 || metadata.height < 16) {
      return { 
        valid: false, 
        error: `Image is too small (${metadata.width}x${metadata.height}px). Minimum size is 16x16 pixels.` 
      };
    }

    // Check maximum dimensions (reasonable limits)
    if (metadata.width > 8000 || metadata.height > 8000) {
      return { 
        valid: false, 
        error: `Image is too large (${metadata.width}x${metadata.height}px). Maximum size is 8000x8000 pixels.` 
      };
    }

    // Check for corrupted files
    if (metadata.format && !['jpeg', 'png', 'webp', 'gif'].includes(metadata.format)) {
      return { 
        valid: false, 
        error: `Unsupported image format (${metadata.format}). Please use JPEG, PNG, WebP, or GIF.` 
      };
    }

    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: 'Could not process this image. The file may be corrupted or in an unsupported format.' 
    };
  }
}

export function validateFileSize(file: File, maxSizeMB: number): FileValidationResult {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }
  return { valid: true };
}

export function validateFileType(file: File, allowedTypes: string[]): FileValidationResult {
  if (!allowedTypes.includes(file.type)) {
    const typesList = allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ');
    return {
      valid: false,
      error: `File must be of type: ${typesList}`
    };
  }
  return { valid: true };
}