'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImage, validateImageFile, optimizeImageFile, extractPathFromUrl } from '@/lib/supabase/storage'
import Image from 'next/image'

interface ImageUploadProps {
  currentImageUrl?: string
  onImageUploaded: (url: string) => void
  onImageRemoved?: () => void
  bucket: 'post-images' | 'product-images' | 'avatars'
  folder?: string
  className?: string
  showPreview?: boolean
  maxWidth?: number
  maxHeight?: number
}

export default function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  bucket,
  folder,
  className = '',
  showPreview = true,
  maxWidth = 1920,
  maxHeight = 1080
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error!)
      return
    }

    setUploading(true)
    try {
      // Optimize image if needed
      const optimizedFile = await optimizeImageFile(file, maxWidth, maxHeight)
      
      // Upload to Supabase Storage
      const result = await uploadImage(optimizedFile, bucket, folder)
      
      // Set preview
      setPreviewUrl(result.url)
      
      // Notify parent component
      onImageUploaded(result.url)
      
      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageRemoved?.()
    toast.success('Image removed')
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const displayUrl = previewUrl || currentImageUrl

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Button */}
      <div className="flex items-center space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={uploading}
          className="flex items-center space-x-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
        </Button>
        
        {displayUrl && onImageRemoved && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemoveImage}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview */}
      {showPreview && displayUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={displayUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    console.error('Image load error:', e)
                    toast.error('Failed to load image preview')
                  }}
                />
              </div>
              
              {/* Image Info */}
              <div className="mt-2 text-sm text-gray-600">
                <p>Image uploaded successfully</p>
                <p className="text-xs text-gray-500 truncate">
                  {displayUrl}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Guidelines */}
      <div className="text-sm text-gray-500">
        <p>• Supported formats: JPG, PNG, GIF, WebP</p>
        <p>• Maximum file size: 5MB</p>
        <p>• Images will be automatically optimized</p>
      </div>
    </div>
  )
}

