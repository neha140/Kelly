'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User } from '@supabase/supabase-js'

interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  sender_profile: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
}

interface FriendRequestsProps {
  user: User
}

export default function FriendRequests({ user }: FriendRequestsProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchFriendRequests()
  }, [])

  const fetchFriendRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender_profile:profiles!friend_requests_sender_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching friend requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status })
        .eq('id', requestId)

      if (error) throw error

      // If accepted, create friendship record
      if (status === 'accepted') {
        const request = requests.find(r => r.id === requestId)
        if (request) {
          const { error: friendshipError } = await supabase
            .from('friendships')
            .insert([
              {
                user_id: user.id,
                friend_id: request.sender_id
              },
              {
                user_id: request.sender_id,
                friend_id: user.id
              }
            ])

          if (friendshipError) throw friendshipError
        }
      }

      // Remove the request from the list
      setRequests(requests.filter(r => r.id !== requestId))
    } catch (error) {
      console.error('Error responding to friend request:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading friend requests...</p>
        </div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No friend requests</h3>
        <p className="text-gray-500">You don't have any pending friend requests at the moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Friend Requests ({requests.length})
        </h2>
        <Badge variant="secondary">{requests.length} pending</Badge>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={request.sender_profile.avatar_url} />
                  <AvatarFallback>
                    {request.sender_profile.full_name?.charAt(0) || 
                     request.sender_profile.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {request.sender_profile.full_name || request.sender_profile.username}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    @{request.sender_profile.username}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleRequestResponse(request.id, 'accepted')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestResponse(request.id, 'rejected')}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
