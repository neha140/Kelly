import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { friend_id } = await request.json()
    
    if (!friend_id) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prevent self-friending
    if (friend_id === user.id) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 })
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friend_id}),and(requester_id.eq.${friend_id},addressee_id.eq.${user.id})`)
      .single()

    if (existingFriendship) {
      if (existingFriendship.status === 'pending') {
        return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 })
      } else if (existingFriendship.status === 'accepted') {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 })
      } else if (existingFriendship.status === 'declined') {
        return NextResponse.json({ error: 'Previous friend request was declined' }, { status: 400 })
      }
    }

    // Check if target user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', friend_id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create friend request
    const { data: friendship, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        addressee_id: friend_id,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Friend request error:', error)
      return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Friend request sent successfully',
      friendship 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

