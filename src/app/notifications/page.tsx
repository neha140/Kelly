import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import NotificationList from '@/components/notifications/NotificationList'

export default async function NotificationsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in to view notifications.</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your social activity</p>
        </div>
        
        <NotificationList user={user} />
      </div>
    </div>
  )
}

