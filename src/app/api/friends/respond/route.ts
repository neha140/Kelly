import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { request_id, action } = await request.json()
    
    if (!request_id || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 })
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Action must be either "accept" or "decline"' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the friendship request
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', request_id)
      .eq('addressee_id', user.id) // Only the addressee can respond
      .eq('status', 'pending')
      .single()

    if (fetchError || !friendship) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    // Update the friendship status
    const { data: updatedFriendship, error: updateError } = await supabase
      .from('friendships')
      .update({ status: action === 'accept' ? 'accepted' : 'declined' })
      .eq('id', request_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update friendship error:', updateError)
      return NextResponse.json({ error: 'Failed to update friend request' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Friend request ${action}ed successfully`,
      friendship: updatedFriendship 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

