import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import RegistryList from '@/components/registry/RegistryList'
import CreateRegistryButton from '@/components/registry/CreateRegistryButton'

export default async function RegistryPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in to view registries.</div>
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Registries</h1>
            <p className="text-gray-600">Create and manage your gift registries</p>
          </div>
          <CreateRegistryButton />
        </div>
        <RegistryList user={user} />
      </div>
    </div>
  )
}
