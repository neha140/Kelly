'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface CommentFormProps {
  postId?: string
  itemId?: string
  user: any
  profile: any
  onCommentAdded: (comment: any) => void
}

export default function CommentForm({ postId, itemId, user, profile, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()
      
      let insertData
      let tableName
      
      if (postId) {
        insertData = {
          post_id: postId,
          user_id: user.id,
          content: content.trim()
        }
        tableName = 'post_comments'
      } else if (itemId) {
        insertData = {
          item_id: itemId,
          user_id: user.id,
          content: content.trim()
        }
        tableName = 'registry_item_comments'
      } else {
        throw new Error('Either postId or itemId must be provided')
      }

      const { data, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select(`
          *,
          user:profiles!${tableName}_user_id_fkey(*)
        `)
        .single()

      if (error) {
        toast.error('Failed to add comment')
        console.error('Error adding comment:', error)
      } else {
        toast.success('Comment added successfully!')
        setContent('')
        onCommentAdded(data)
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url} alt={profile?.display_name} />
          <AvatarFallback>
            {profile?.display_name?.charAt(0) || user?.email?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {content.length}/500
            </span>
            <Button 
              type="submit" 
              disabled={loading || !content.trim()}
              size="sm"
            >
              <Send className="h-4 w-4 mr-1" />
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

