'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface CommentItemProps {
  comment: {
    id: string
    content: string
    created_at: string
    updated_at: string
    user_id: string
    user: {
      id: string
      display_name: string | null
      avatar_url: string | null
      email: string
    }
  }
  currentUser: any
  onCommentDeleted: (commentId: string) => void
  onCommentUpdated: (comment: any) => void
}

export default function CommentItem({ 
  comment, 
  currentUser, 
  onCommentDeleted, 
  onCommentUpdated 
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [loading, setLoading] = useState(false)

  const isOwner = comment.user_id === currentUser.id

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Determine which table to delete from based on the comment structure
      // This is a simplified approach - in a real app you'd pass the table name
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', comment.id)

      if (error) {
        // Try registry_item_comments if post_comments failed
        const { error: error2 } = await supabase
          .from('registry_item_comments')
          .delete()
          .eq('id', comment.id)

        if (error2) {
          throw error2
        }
      }

      toast.success('Comment deleted successfully')
      onCommentDeleted(comment.id)
    } catch (err) {
      toast.error('Failed to delete comment')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editContent.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Determine which table to update based on the comment structure
      const { data, error } = await supabase
        .from('post_comments')
        .update({ content: editContent.trim() })
        .eq('id', comment.id)
        .select(`
          *,
          user:profiles!post_comments_user_id_fkey(*)
        `)
        .single()

      if (error) {
        // Try registry_item_comments if post_comments failed
        const { data: data2, error: error2 } = await supabase
          .from('registry_item_comments')
          .update({ content: editContent.trim() })
          .eq('id', comment.id)
          .select(`
            *,
            user:profiles!registry_item_comments_user_id_fkey(*)
          `)
          .single()

        if (error2) {
          throw error2
        } else {
          onCommentUpdated(data2)
        }
      } else {
        onCommentUpdated(data)
      }

      toast.success('Comment updated successfully')
      setIsEditing(false)
    } catch (err) {
      toast.error('Failed to update comment')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(comment.content)
    setIsEditing(false)
  }

  return (
    <div className="flex space-x-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.user.avatar_url} alt={comment.user.display_name} />
        <AvatarFallback>
          {comment.user.display_name?.charAt(0) || comment.user.email.charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h4 className="text-sm font-medium text-gray-900">
            {comment.user.display_name || 'No name set'}
          </h4>
          <span className="text-xs text-gray-500">
            {new Date(comment.created_at).toLocaleString()}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] resize-none"
              maxLength={500}
            />
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={loading || !editContent.trim()}
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
            
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

