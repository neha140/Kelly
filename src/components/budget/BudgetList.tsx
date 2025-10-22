'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DollarSign, Gift, Eye, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import SetBudgetModal from './SetBudgetModal'

interface BudgetListProps {
  user: any
}

interface Budget {
  id: string
  amount: number
  currency: string
  created_at: string
  updated_at: string
  friend_id: string
  registry_id: string | null
  friend: {
    id: string
    display_name: string | null
    avatar_url: string | null
    email: string
  }
  registry?: {
    id: string
    title: string
  }
}

export default function BudgetList({ user }: BudgetListProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          friend:profiles!budgets_friend_id_fkey(*),
          registry:registries(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching budgets:', error)
        toast.error('Failed to load budgets')
      } else {
        setBudgets(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBudget = async (budgetId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to delete the budget for ${friendName}?`)) {
      return
    }

    setDeleting(budgetId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)

      if (error) {
        console.error('Error deleting budget:', error)
        toast.error('Failed to delete budget')
      } else {
        toast.success('Budget deleted successfully')
        setBudgets(prev => prev.filter(budget => budget.id !== budgetId))
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">Loading budgets...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets set</h3>
            <p className="text-gray-500 mb-4">Set budgets for your friends to get smart gift recommendations</p>
            <SetBudgetModal />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={budget.friend.avatar_url} alt={budget.friend.display_name} />
                      <AvatarFallback>
                        {budget.friend.display_name?.charAt(0) || budget.friend.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {budget.friend.display_name || 'No name set'}
                      </CardTitle>
                      <p className="text-sm text-gray-500">{budget.friend.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      ${budget.amount.toFixed(2)} {budget.currency}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budget.registry && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Gift className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">{budget.registry.title}</span>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/registry/${budget.registry.id}?budget=${budget.amount}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Registry
                        </Link>
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Set on {new Date(budget.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // TODO: Implement edit functionality
                          toast.info('Edit functionality coming soon')
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteBudget(budget.id, budget.friend.display_name || budget.friend.email)}
                        disabled={deleting === budget.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
