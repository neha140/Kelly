'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AddProductModal from './AddProductModal'
import ProductItem from './ProductItem'
import { ArrowLeft, Calendar, Users, Eye, Lock, Plus, Share2 } from 'lucide-react'

interface RegistryDetailProps {
  registry: any
  user: any
  isOwner: boolean
}

export default function RegistryDetail({ registry, user, isOwner }: RegistryDetailProps) {
  const [showAddProduct, setShowAddProduct] = useState(false)

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Eye className="h-4 w-4" />
      case 'friends':
        return <Users className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case 'public':
        return 'Public'
      case 'friends':
        return 'Friends Only'
      case 'private':
        return 'Private'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTotalItems = () => {
    return registry.registry_items.length
  }

  const getAvailableItems = () => {
    return registry.registry_items.filter((item: any) => item.status === 'available').length
  }

  const getTotalValue = () => {
    return registry.registry_items.reduce((sum: number, item: any) => sum + (item.price || 0), 0)
  }

  const getAvailableValue = () => {
    return registry.registry_items
      .filter((item: any) => item.status === 'available')
      .reduce((sum: number, item: any) => sum + (item.price || 0), 0)
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/registry">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Registries
          </Link>
        </Button>
      </div>

      {/* Registry Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{registry.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={registry.profiles?.avatar_url} alt={registry.profiles?.display_name} />
                    <AvatarFallback>
                      {registry.profiles?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span>by {registry.profiles?.display_name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getAccessLevelIcon(registry.access_level)}
                  <span>{getAccessLevelLabel(registry.access_level)}</span>
                </div>
                {registry.event_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(registry.event_date)}</span>
                  </div>
                )}
              </div>
              {registry.description && (
                <p className="text-gray-600">{registry.description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {isOwner && (
                <Button size="sm" onClick={() => setShowAddProduct(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getTotalItems()}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{getAvailableItems()}</div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${getTotalValue().toFixed(2)}</div>
              <div className="text-sm text-gray-500">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${getAvailableValue().toFixed(2)}</div>
              <div className="text-sm text-gray-500">Available Value</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Items</h2>
          {isOwner && (
            <Button onClick={() => setShowAddProduct(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>

        {registry.registry_items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No items in this registry yet.</p>
              {isOwner && (
                <Button className="mt-4" onClick={() => setShowAddProduct(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {registry.registry_items.map((item: any) => (
              <ProductItem
                key={item.id}
                item={item}
                isOwner={isOwner}
                onUpdate={() => {
                  // Refresh the page to get updated data
                  window.location.reload()
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProductModal
          registryId={registry.id}
          onClose={() => setShowAddProduct(false)}
          onSuccess={() => {
            setShowAddProduct(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
