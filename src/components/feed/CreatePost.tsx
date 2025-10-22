'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import ImageUpload from '@/components/ui/ImageUpload'
import { toast } from 'sonner'

interface CreatePostProps {
  user: any
  profile: any
}

export default function CreatePost({ user, profile }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !imageUrl) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim() || null,
          image_url: imageUrl,
        })

      if (error) {
        toast.error('Failed to create post')
        console.error('Error creating post:', error)
      } else {
        toast.success('Post created successfully!')
        setContent('')
        setImageUrl(null)
        // Trigger a refresh of the feed
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
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url} alt={profile?.display_name} />
              <AvatarFallback>
                {profile?.display_name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind? Share an update about your registry or celebration..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {content.length}/500
                </span>
                <Button 
                  type="submit" 
                  disabled={loading || (!content.trim() && !imageUrl)}
                  size="sm"
                >
                  {loading ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Image Upload */}
          <ImageUpload
            currentImageUrl={imageUrl || undefined}
            onImageUploaded={setImageUrl}
            onImageRemoved={() => setImageUrl(null)}
            bucket="post-images"
            folder={`user-${user.id}`}
            showPreview={true}
          />
        </form>
      </CardContent>
    </Card>
  )
}
