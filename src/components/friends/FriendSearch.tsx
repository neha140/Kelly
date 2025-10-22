'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface FriendSearchProps {
  user: any
}

interface SearchResult {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string
  bio: string | null
  friendship_status?: 'none' | 'pending' | 'accepted' | 'declined'
}

export default function FriendSearch({ user }: FriendSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/friends/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() })
      })

      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
      } else {
        toast.error('Failed to search for users')
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async (friendId: string) => {
    setSendingRequest(friendId)
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: friendId })
      })

      if (response.ok) {
        toast.success('Friend request sent!')
        // Update the status in search results
        setSearchResults(prev => 
          prev.map(result => 
            result.id === friendId 
              ? { ...result, friendship_status: 'pending' }
              : result
          )
        )
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to send friend request')
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      console.error('Send request error:', err)
    } finally {
      setSendingRequest(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Find Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !searchQuery.trim()}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={result.avatar_url || undefined} alt={result.display_name || ''} />
                      <AvatarFallback>
                        {result.display_name?.charAt(0) || result.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {result.display_name || 'No name set'}
                      </h3>
                      <p className="text-sm text-gray-500">{result.email}</p>
                      {result.bio && (
                        <p className="text-sm text-gray-600 mt-1">{result.bio}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {result.friendship_status === 'none' && (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(result.id)}
                        disabled={sendingRequest === result.id}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {sendingRequest === result.id ? 'Sending...' : 'Add Friend'}
                      </Button>
                    )}
                    {result.friendship_status === 'pending' && (
                      <span className="text-sm text-yellow-600 font-medium">
                        Request Sent
                      </span>
                    )}
                    {result.friendship_status === 'accepted' && (
                      <span className="text-sm text-green-600 font-medium">
                        Friends
                      </span>
                    )}
                    {result.friendship_status === 'declined' && (
                      <span className="text-sm text-red-600 font-medium">
                        Declined
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults.length === 0 && searchQuery && !loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No users found matching "{searchQuery}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

