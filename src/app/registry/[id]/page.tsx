import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import RegistryDetail from '@/components/registry/RegistryDetail'

interface RegistryPageProps {
  params: {
    id: string
  }
}

export default async function RegistryPage({ params }: RegistryPageProps) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get registry with items
  const { data: registry, error } = await supabase
    .from('registries')
    .select(`
      *,
      profiles!registries_user_id_fkey (
        display_name,
        avatar_url
      ),
      registry_items (
        *
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !registry) {
    notFound()
  }

  // Check if user has access to this registry
  const isOwner = registry.user_id === user.id
  const isPublic = registry.access_level === 'public'
  
  // For now, we'll allow access to all registries (friends check will be implemented later)
  if (!isOwner && !isPublic) {
    // TODO: Check if user is friends with registry owner
    // For now, redirect to not found
    notFound()
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
        <RegistryDetail 
          registry={registry} 
          user={user} 
          isOwner={isOwner}
        />
      </div>
    </div>
  )
}
