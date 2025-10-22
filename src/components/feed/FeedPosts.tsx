'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Share } from 'lucide-react'
import CommentSection from '@/components/comments/CommentSection'

interface FeedPostsProps {
  user: any
  profile?: any
}

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    display_name: string
    avatar_url: string
  }
  post_likes: Array<{
    user_id: string
  }>
  post_comments: Array<{
    id: string
    content: string
    created_at: string
    profiles: {
      display_name: string
      avatar_url: string
    }
  }>
}

export default function FeedPosts({ user, profile }: FeedPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
    
    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel('posts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => {
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      const supabase = createClient()
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPosts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            display_name,
            avatar_url
          ),
          post_likes (
            user_id
          ),
          post_comments (
            id,
            content,
            created_at,
            profiles!post_comments_user_id_fkey (
              display_name,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching posts:', error)
        toast.error('Failed to load posts')
      } else {
        setPosts(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    const isLiked = posts.find(p => p.id === postId)?.post_likes.some(like => like.user_id === user.id)
    
    try {
      const supabase = createClient()
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
        
        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })
        
        if (error) throw error
      }
      
      // Refresh posts to get updated like count
      fetchPosts()
    } catch (err) {
      console.error('Error toggling like:', err)
      toast.error('Failed to update like')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No posts yet. Be the first to share something!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const isLiked = post.post_likes.some(like => like.user_id === user.id)
        const likeCount = post.post_likes.length
        
        return (
          <Card key={post.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.profiles.avatar_url} alt={post.profiles.display_name} />
                  <AvatarFallback>
                    {post.profiles.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{post.profiles.display_name}</p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed mb-4">{post.content}</p>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-1 ${
                    isLiked ? 'text-red-500' : 'hover:text-red-500'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </Button>
                
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:text-blue-500">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.post_comments.length}</span>
                </Button>
                
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:text-green-500">
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
              
              {/* Comments Section */}
              <div className="mt-4 pt-4 border-t">
                <CommentSection 
                  postId={post.id} 
                  user={user} 
                  profile={profile}
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
