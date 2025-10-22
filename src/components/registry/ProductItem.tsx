'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import CommentSection from '@/components/comments/CommentSection'
import { ExternalLink, Heart, MessageCircle, Share2, Trash2 } from 'lucide-react'

interface ProductItemProps {
  item: any
  isOwner: boolean
  onUpdate: () => void
  user?: any
  profile?: any
}

export default function ProductItem({ item, isOwner, onUpdate, user, profile }: ProductItemProps) {
  const [loading, setLoading] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800'
      case 'purchased':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('registry_items')
        .update({ status: newStatus })
        .eq('id', item.id)

      if (error) {
        toast.error('Failed to update item status')
        console.error('Error updating status:', error)
      } else {
        toast.success('Item status updated')
        onUpdate()
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('registry_items')
        .delete()
        .eq('id', item.id)

      if (error) {
        toast.error('Failed to delete item')
        console.error('Error deleting item:', error)
      } else {
        toast.success('Item deleted successfully')
        onUpdate()
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Image */}
          {item.image_url ? (
            <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none'
                }}
                unoptimized={item.image_url.includes('via.placeholder.com')}
              />
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
            
            {item.description && (
              <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
            )}

            <div className="flex items-center justify-between">
              {item.price && (
                <span className="font-semibold text-sm">${Number(item.price).toFixed(2)}</span>
              )}
              <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                {item.status}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              {item.url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1 mr-2"
                >
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </a>
                </Button>
              )}
              
              {isOwner && (
                <div className="flex space-x-1">
                  <Select
                    value={item.status}
                    onValueChange={handleStatusChange}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="purchased">Purchased</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Comments Section */}
          {user && profile && (
            <div className="mt-4 pt-4 border-t">
              <CommentSection 
                itemId={item.id} 
                user={user} 
                profile={profile}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
