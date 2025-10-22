import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { friend_id, budget_amount, registry_id } = await request.json()
    
    if (!friend_id || !budget_amount) {
      return NextResponse.json({ error: 'Friend ID and budget amount are required' }, { status: 400 })
    }

    if (budget_amount <= 0) {
      return NextResponse.json({ error: 'Budget amount must be greater than 0' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query for registry items
    let query = supabase
      .from('registry_items')
      .select(`
        *,
        registry:registries(*)
      `)
      .eq('registry.user_id', friend_id)
      .not('price', 'is', null)

    // If specific registry is provided, filter by it
    if (registry_id) {
      query = query.eq('registry_id', registry_id)
    }

    const { data: items, error } = await query

    if (error) {
      console.error('Error fetching items:', error)
      return NextResponse.json({ error: 'Failed to fetch registry items' }, { status: 500 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: 'No items found in registry'
      })
    }

    // Smart recommendation algorithm
    const recommendations = items.map(item => {
      const price = item.price || 0
      let score = 0
      let category = ''

      // Scoring logic based on budget proximity
      if (price <= budget_amount) {
        // Within budget: score = (price / budget) * 100
        // Higher score for items closer to the budget limit
        score = (price / budget_amount) * 100
        category = 'within_budget'
      } else if (price <= budget_amount * 1.1) {
        // Slightly over budget (≤10%): score = 50 - ((price - budget) / budget * 100)
        // Lower score for items further over budget
        score = 50 - ((price - budget_amount) / budget_amount * 100)
        category = 'slightly_over'
      } else {
        // Way over budget: very low score
        score = Math.max(0, 20 - ((price - budget_amount) / budget_amount * 50))
        category = 'over_budget'
      }

      // Availability bonus
      const availabilityMultiplier = {
        'available': 1.0,
        'reserved': 0.7,
        'purchased': 0.3
      }
      score *= availabilityMultiplier[item.status as keyof typeof availabilityMultiplier]

      // Bonus for items with images (better presentation)
      if (item.image_url) {
        score *= 1.1
      }

      // Bonus for items with URLs (easier to purchase)
      if (item.url) {
        score *= 1.05
      }

      return {
        ...item,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        category,
        budget_proximity: Math.round(((price - budget_amount) / budget_amount) * 100)
      }
    })

    // Sort by score (highest first)
    recommendations.sort((a, b) => b.score - a.score)

    // Separate recommendations by category
    const withinBudget = recommendations.filter(r => r.category === 'within_budget')
    const slightlyOver = recommendations.filter(r => r.category === 'slightly_over')
    const overBudget = recommendations.filter(r => r.category === 'over_budget')

    // Get alternative suggestions (items slightly over budget)
    const alternatives = slightlyOver.slice(0, 3)

    return NextResponse.json({
      recommendations: {
        within_budget: withinBudget.slice(0, 10), // Top 10 within budget
        alternatives: alternatives, // Up to 3 alternatives
        over_budget: overBudget.slice(0, 5) // Top 5 over budget for reference
      },
      budget_amount,
      total_items: items.length,
      within_budget_count: withinBudget.length,
      alternatives_count: alternatives.length
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

