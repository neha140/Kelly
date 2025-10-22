import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/layout/Navigation'
import BudgetList from '@/components/budget/BudgetList'
import SetBudgetModal from '@/components/budget/SetBudgetModal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function BudgetPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in to view budgets.</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
            <p className="text-gray-600">Set budgets for friends and get smart gift recommendations</p>
          </div>
          <SetBudgetModal />
        </div>
        
        <BudgetList user={user} />
      </div>
    </div>
  )
}

