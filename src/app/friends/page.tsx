import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import FriendSearch from '@/components/friends/FriendSearch'
import FriendRequests from '@/components/friends/FriendRequests'
import FriendsList from '@/components/friends/FriendsList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function FriendsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in to view friends.</div>
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
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
          <p className="text-gray-600">Connect with friends and manage your social network</p>
        </div>
        
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Find Friends</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="friends">My Friends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-4">
            <FriendSearch user={user} />
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4">
            <FriendRequests user={user} />
          </TabsContent>
          
          <TabsContent value="friends" className="space-y-4">
            <FriendsList user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

