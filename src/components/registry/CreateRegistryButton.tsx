'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

export default function CreateRegistryButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    access_level: 'friends' as 'public' | 'friends' | 'private'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const insertData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        event_date: formData.event_date || null,
        access_level: formData.access_level,
      }

      console.log('Inserting registry with data:', insertData)

      const { error } = await supabase
        .from('registries')
        .insert(insertData)

      if (error) {
        toast.error('Failed to create registry')
        console.error('Error creating registry:', error)
      } else {
        toast.success('Registry created successfully!')
        setOpen(false)
        setFormData({
          title: '',
          description: '',
          event_date: '',
          access_level: 'friends'
        })
        // Refresh the page to show the new registry
        window.location.reload()
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
          Create Registry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Registry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Registry Title</Label>
            <Input
              id="title"
              placeholder="e.g., My Birthday Wishlist"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Tell people about your registry..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date">Event Date (Optional)</Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_level">Who can see this registry?</Label>
            <Select
              value={formData.access_level}
              onValueChange={(value: 'public' | 'friends' | 'private') => 
                setFormData({ ...formData, access_level: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Everyone (Public)</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Registry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
