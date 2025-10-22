'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Send, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import CommentForm from './CommentForm'
import CommentItem from './CommentItem'

interface CommentSectionProps {
  postId?: string
  itemId?: string
  user: any
  profile: any
}

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  post_id?: string
  item_id?: string
  user: {
    id: string
    display_name: string | null
    avatar_url: string | null
    email: string
  }
}

export default function CommentSection({ postId, itemId, user, profile }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId, itemId])

  const fetchComments = async () => {
    try {
      const supabase = createClient()
      
      let query
      if (postId) {
        query = supabase
          .from('post_comments')
          .select(`
            *,
            user:profiles!post_comments_user_id_fkey(*)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true })
      } else if (itemId) {
        query = supabase
          .from('registry_item_comments')
          .select(`
            *,
            user:profiles!registry_item_comments_user_id_fkey(*)
          `)
          .eq('item_id', itemId)
          .order('created_at', { ascending: true })
      } else {
        return
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching comments:', error)
        toast.error('Failed to load comments')
      } else {
        setComments(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCommentAdded = (newComment: Comment) => {
    setComments(prev => [...prev, newComment])
    setShowForm(false)
  }

  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId))
  }

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === updatedComment.id ? updatedComment : comment
      )
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <MessageCircle className="h-5 w-5 mr-2" />
            Comments ({comments.length})
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add Comment'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        {showForm && (
          <CommentForm
            postId={postId}
            itemId={itemId}
            user={user}
            profile={profile}
            onCommentAdded={handleCommentAdded}
          />
        )}

        {/* Comments List */}
        {loading ? (
          <div className="py-4 text-center">
            <p className="text-gray-500">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center">
            <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No comments yet</p>
            <p className="text-sm text-gray-400">Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={user}
                onCommentDeleted={handleCommentDeleted}
                onCommentUpdated={handleCommentUpdated}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

