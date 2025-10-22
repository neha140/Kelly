import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Search for users by display_name or email
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id) // Exclude current user
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20)

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
    }

    // Get existing friendships for these users
    const userIds = profiles?.map(p => p.id) || []
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id, status')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    // Create a map of friendship statuses
    const friendshipMap = new Map()
    friendships?.forEach(friendship => {
      const otherUserId = friendship.requester_id === user.id 
        ? friendship.addressee_id 
        : friendship.requester_id
      friendshipMap.set(otherUserId, friendship.status)
    })

    // Add friendship status to each profile
    const results = profiles?.map(profile => ({
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      email: profile.email,
      bio: profile.bio,
      friendship_status: friendshipMap.get(profile.id) || 'none'
    })) || []

    return NextResponse.json(results)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

