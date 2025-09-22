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
    return { 
      valid: false, 
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` 
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
    return { 
      valid: false, 
      error: 'File must be an image (JPEG, PNG, WebP, GIF, or SVG)' 
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
      return { valid: false, error: 'Invalid image file' };
    }

    // Check minimum dimensions
    if (metadata.width < 16 || metadata.height < 16) {
      return { 
        valid: false, 
        error: 'Image must be at least 16x16 pixels' 
      };
    }

    // Check maximum dimensions (reasonable limits)
    if (metadata.width > 8000 || metadata.height > 8000) {
      return { 
        valid: false, 
        error: 'Image must be smaller than 8000x8000 pixels' 
      };
    }

    // Check for corrupted files
    if (metadata.format && !['jpeg', 'png', 'webp', 'gif'].includes(metadata.format)) {
      return { 
        valid: false, 
        error: 'Unsupported image format detected' 
      };
    }

    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: 'Invalid or corrupted image file' 
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