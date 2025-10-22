'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface SetBudgetModalProps {
  onBudgetSet?: () => void
}

interface Friend {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string
}

interface Registry {
  id: string
  title: string
  user_id: string
}

export default function SetBudgetModal({}: SetBudgetModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [registries, setRegistries] = useState<Registry[]>([])
  const [formData, setFormData] = useState({
    friend_id: '',
    registry_id: '',
    amount: '',
    currency: 'USD'
  })

  useEffect(() => {
    if (open) {
      fetchFriends()
    }
  }, [open])

  useEffect(() => {
    if (formData.friend_id) {
      fetchFriendRegistries(formData.friend_id)
    }
  }, [formData.friend_id])

  const fetchFriends = async () => {
    try {
      const supabase = createClient()
      
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Get accepted friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          requester_id,
          addressee_id,
          requester:profiles!friendships_requester_id_fkey(*),
          addressee:profiles!friendships_addressee_id_fkey(*)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (error) {
        console.error('Error fetching friends:', error)
        return
      }

      // Transform to get friend profiles
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
            email: profile.email
          })
        }
      })
      
      setFriends(friendsList)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const fetchFriendRegistries = async (friendId: string) => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('registries')
        .select('id, title, user_id')
        .eq('user_id', friendId)
        .eq('access_level', 'public')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching registries:', error)
      } else {
        setRegistries(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.friend_id || !formData.amount) return

    setLoading(true)
    try {
      const response = await fetch('/api/budget/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friend_id: formData.friend_id,
          registry_id: formData.registry_id || null,
          amount: parseFloat(formData.amount),
          currency: formData.currency
        })
      })

      if (response.ok) {
        toast.success('Budget set successfully!')
        setOpen(false)
        setFormData({ friend_id: '', registry_id: '', amount: '', currency: 'USD' })
        // Trigger a refresh of the budget list
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to set budget')
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Set Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Set Budget for Friend
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="friend">Friend *</Label>
            <Select
              value={formData.friend_id}
              onValueChange={(value) => setFormData({ ...formData, friend_id: value, registry_id: '' })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a friend" />
              </SelectTrigger>
              <SelectContent>
                {friends.map((friend) => (
                  <SelectItem key={friend.id} value={friend.id}>
                    {friend.display_name || friend.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.friend_id && registries.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="registry">Registry (Optional)</Label>
              <Select
                value={formData.registry_id}
                onValueChange={(value) => setFormData({ ...formData, registry_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a registry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific registry</SelectItem>
                  {registries.map((registry) => (
                    <SelectItem key={registry.id} value={registry.id}>
                      {registry.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.friend_id || !formData.amount}>
              {loading ? 'Setting...' : 'Set Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
