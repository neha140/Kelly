'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, UserMinus, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface FriendsListProps {
  user: any
}

interface Friend {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string
  bio: string | null
  friendship_id: string
  created_at: string
}

export default function FriendsList({ user }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      const supabase = createClient()
      
      // Get accepted friendships where user is either requester or addressee
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          created_at,
          requester:profiles!friendships_requester_id_fkey(*),
          addressee:profiles!friendships_addressee_id_fkey(*)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching friends:', error)
        toast.error('Failed to load friends')
      } else {
        // Transform the data to get friend profiles
        const friendsList: Friend[] = []
        
        friendships?.forEach(friendship => {
          const isRequester = friendship.requester_id === user.id
          const friendProfile = isRequester ? friendship.addressee : friendship.requester
          
          if (friendProfile && typeof friendProfile === 'object' && 'id' in friendProfile) {
            const profile = friendProfile as any
            friendsList.push({
              id: profile.id,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              email: profile.email,
              bio: profile.bio,
              friendship_id: friendship.id,
              created_at: friendship.created_at
            })
          }
        })
        
        setFriends(friendsList)
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
      return
    }

    setRemoving(friendshipId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) {
        console.error('Error removing friend:', error)
        toast.error('Failed to remove friend')
      } else {
        toast.success('Friend removed successfully')
        setFriends(prev => prev.filter(friend => friend.friendship_id !== friendshipId))
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">Loading friends...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            My Friends
          </span>
          {friends.length > 0 && (
            <Badge variant="secondary">{friends.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No friends yet</p>
            <p className="text-sm text-gray-400">Start by searching for friends or accepting requests!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.avatar_url || undefined} alt={friend.display_name || ''} />
                    <AvatarFallback>
                      {friend.display_name?.charAt(0) || friend.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {friend.display_name || 'No name set'}
                    </h3>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                    {friend.bio && (
                      <p className="text-sm text-gray-600 mt-1">{friend.bio}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Friends since {new Date(friend.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/registry?user=${friend.id}`}>
                      <Gift className="h-4 w-4 mr-1" />
                      View Registry
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveFriend(friend.friendship_id, friend.display_name || friend.email)}
                    disabled={removing === friend.friendship_id}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

