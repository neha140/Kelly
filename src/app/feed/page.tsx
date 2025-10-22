import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import FeedPosts from '@/components/feed/FeedPosts'
import CreatePost from '@/components/feed/CreatePost'

export default async function FeedPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in to view the feed.</div>
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} profile={profile} />
      <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <CreatePost user={user} profile={profile} />
          <FeedPosts user={user} profile={profile} />
        </div>
      </div>
    </div>
  )
}
