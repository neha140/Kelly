import { createClient } from '@/lib/supabase/client'

export interface UploadResult {
  url: string
  path: string
}

export interface UploadError {
  message: string
  code?: string
}

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadImage(
  file: File, 
  bucket: string, 
  folder?: string
): Promise<UploadResult> {
  const supabase = createClient()
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }
  
  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB')
  }
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = folder ? `${folder}/${fileName}` : fileName
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)
    
    return {
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(bucket: string, path: string): Promise<void> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

/**
 * Get public URL for an image
 */
export function getImageUrl(bucket: string, path: string): string {
  const supabase = createClient()
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

/**
 * Extract path from Supabase Storage URL
 */
export function extractPathFromUrl(url: string, bucket: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(new RegExp(`/${bucket}/(.+)`))
    return pathMatch ? pathMatch[1] : null
  } catch {
    return null
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' }
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }
  
  // Check file name
  if (!file.name || file.name.trim() === '') {
    return { valid: false, error: 'File must have a name' }
  }
  
  return { valid: true }
}

/**
 * Create optimized image file (resize if needed)
 */
export function optimizeImageFile(file: File, maxWidth = 1920, maxHeight = 1080): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Could not create canvas context'))
      return
    }
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }
      
      // Set canvas dimensions
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(optimizedFile)
          } else {
            reject(new Error('Could not create optimized image'))
          }
        },
        file.type,
        0.8 // 80% quality
      )
    }
    
    img.onerror = () => {
      reject(new Error('Could not load image'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

