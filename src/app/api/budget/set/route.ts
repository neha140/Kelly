import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { friend_id, registry_id, amount, currency = 'USD' } = await request.json()
    
    if (!friend_id || !amount) {
      return NextResponse.json({ error: 'Friend ID and amount are required' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prevent setting budget for yourself
    if (friend_id === user.id) {
      return NextResponse.json({ error: 'Cannot set budget for yourself' }, { status: 400 })
    }

    // Check if friendship exists and is accepted
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friend_id}),and(requester_id.eq.${friend_id},addressee_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .single()

    if (!friendship) {
      return NextResponse.json({ error: 'You must be friends to set a budget' }, { status: 400 })
    }

    // If registry_id is provided, verify it belongs to the friend
    if (registry_id) {
      const { data: registry } = await supabase
        .from('registries')
        .select('id, user_id, access_level')
        .eq('id', registry_id)
        .single()

      if (!registry) {
        return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
      }

      if (registry.user_id !== friend_id) {
        return NextResponse.json({ error: 'Registry does not belong to the specified friend' }, { status: 400 })
      }

      if (registry.access_level === 'private') {
        return NextResponse.json({ error: 'Cannot set budget for private registry' }, { status: 400 })
      }
    }

    // Check if budget already exists for this friend/registry combination
    const { data: existingBudget } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', user.id)
      .eq('friend_id', friend_id)
      .eq('registry_id', registry_id || null)
      .single()

    if (existingBudget) {
      return NextResponse.json({ error: 'Budget already exists for this friend and registry' }, { status: 400 })
    }

    // Create budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        friend_id,
        registry_id: registry_id || null,
        amount: parseFloat(amount),
        currency
      })
      .select()
      .single()

    if (error) {
      console.error('Budget creation error:', error)
      return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Budget created successfully',
      budget 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

