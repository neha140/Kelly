'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ImageUpload from '@/components/ui/ImageUpload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AddProductModalProps {
  registryId: string
  onClose: () => void
  onSuccess: () => void
  user?: any
}

export default function AddProductModal({ registryId, onClose, onSuccess, user }: AddProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    url: '',
    image_url: '',
    status: 'available' as 'available' | 'reserved' | 'purchased'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('registry_items')
        .insert({
          registry_id: registryId,
          title: formData.title,
          description: formData.description || null,
          price: formData.price ? parseFloat(formData.price) : null,
          url: formData.url || null,
          image_url: formData.image_url || null,
          status: formData.status,
        })

      if (error) {
        toast.error('Failed to add item')
        console.error('Error adding item:', error)
      } else {
        toast.success('Item added successfully!')
        onSuccess()
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlChange = async (url: string) => {
    setFormData({ ...formData, url })
    
    // Auto-fill product information from URL
    if (url && isValidUrl(url)) {
      try {
        setLoading(true)
        const response = await fetch('/api/products/parse-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Auto-fill all available fields
          setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            description: data.description || prev.description,
            price: data.price ? data.price.toString() : prev.price,
            image_url: data.image_url || prev.image_url,
            url: data.original_url || url
          }))
          
          toast.success('Product information loaded successfully!')
        } else {
          toast.error('Failed to parse product information')
        }
      } catch (err) {
        console.error('Error parsing URL:', err)
        toast.error('Could not load product information')
      } finally {
        setLoading(false)
      }
    }
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Item to Registry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Item Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Wireless Headphones"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the item..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'available' | 'reserved' | 'purchased') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="purchased">Purchased</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Product URL</Label>
            <div className="flex space-x-2">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/product"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleUrlChange(formData.url)}
                disabled={loading || !formData.url || !isValidUrl(formData.url)}
                className="px-3"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  'Parse'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Paste any product URL and click Parse to auto-fill information
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Product Image</Label>
            {user ? (
              <ImageUpload
                currentImageUrl={formData.image_url}
                onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                onImageRemoved={() => setFormData({ ...formData, image_url: '' })}
                bucket="product-images"
                folder={`registry-${registryId}`}
                showPreview={true}
              />
            ) : (
              <Input
                id="image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
