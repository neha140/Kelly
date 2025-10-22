'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Gift, Calendar, Users, Eye, EyeOff, Lock, Trash2 } from 'lucide-react'

interface RegistryListProps {
  user: any
}

interface Registry {
  id: string
  title: string
  description: string | null
  event_date: string | null
  access_level: 'public' | 'friends' | 'private'
  created_at: string
  registry_items: Array<{
    id: string
    title: string
    price: number | null
    status: 'available' | 'reserved' | 'purchased'
  }>
}

export default function RegistryList({ user }: RegistryListProps) {
  const [registries, setRegistries] = useState<Registry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRegistries()
  }, [])

  const fetchRegistries = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('registries')
        .select(`
          *,
          registry_items (
            id,
            title,
            price,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching registries:', error)
        toast.error('Failed to load registries')
      } else {
        setRegistries(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRegistry = async (registryId: string) => {
    if (!confirm('Are you sure you want to delete this registry? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('registries')
        .delete()
        .eq('id', registryId)
        .eq('user_id', user.id)

      if (error) {
        toast.error('Failed to delete registry')
        console.error('Error deleting registry:', error)
      } else {
        toast.success('Registry deleted successfully')
        fetchRegistries()
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      console.error('Error:', err)
    }
  }

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Eye className="h-4 w-4" />
      case 'friends':
        return <Users className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      default:
        return <EyeOff className="h-4 w-4" />
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

  const getTotalItems = (items: Registry['registry_items']) => {
    return items.length
  }

  const getAvailableItems = (items: Registry['registry_items']) => {
    return items.filter(item => item.status === 'available').length
  }

  const getTotalValue = (items: Registry['registry_items']) => {
    return items.reduce((sum, item) => sum + (item.price || 0), 0)
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (registries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No registries yet</h3>
          <p className="text-gray-500 mb-4">Create your first registry to start sharing your wishlist with friends and family.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {registries.map((registry) => (
        <Card key={registry.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-1">{registry.title}</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {getAccessLevelIcon(registry.access_level)}
                  <span>{getAccessLevelLabel(registry.access_level)}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRegistry(registry.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {registry.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {registry.description}
              </p>
            )}
            
            {registry.event_date && (
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{formatDate(registry.event_date)}</span>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Items:</span>
                <span className="font-medium">
                  {getAvailableItems(registry.registry_items)} / {getTotalItems(registry.registry_items)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Value:</span>
                <span className="font-medium">
                  ${getTotalValue(registry.registry_items).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <Button asChild className="flex-1">
                <Link href={`/registry/${registry.id}`}>
                  View Registry
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
