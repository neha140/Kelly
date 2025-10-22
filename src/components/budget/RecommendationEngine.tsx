'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Gift, 
  ExternalLink, 
  DollarSign, 
  Star, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface RecommendationEngineProps {
  friendId: string
  budgetAmount: number
  registryId?: string
}

interface RecommendationItem {
  id: string
  title: string
  description: string | null
  price: number | null
  url: string | null
  image_url: string | null
  status: 'available' | 'reserved' | 'purchased'
  score: number
  category: 'within_budget' | 'slightly_over' | 'over_budget'
  budget_proximity: number
}

interface Recommendations {
  within_budget: RecommendationItem[]
  alternatives: RecommendationItem[]
  over_budget: RecommendationItem[]
}

export default function RecommendationEngine({ 
  friendId, 
  budgetAmount, 
  registryId 
}: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    total_items: 0,
    within_budget_count: 0,
    alternatives_count: 0
  })

  useEffect(() => {
    if (friendId && budgetAmount) {
      fetchRecommendations()
    }
  }, [friendId, budgetAmount, registryId])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/budget/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friend_id: friendId,
          budget_amount: budgetAmount,
          registry_id: registryId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations)
        setStats({
          total_items: data.total_items,
          within_budget_count: data.within_budget_count,
          alternatives_count: data.alternatives_count
        })
      } else {
        toast.error('Failed to load recommendations')
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Available</Badge>
      case 'reserved':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Reserved</Badge>
      case 'purchased':
        return <Badge variant="outline"><Gift className="h-3 w-3 mr-1" />Purchased</Badge>
      default:
        return null
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'within_budget':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'slightly_over':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'over_budget':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const renderItemCard = (item: RecommendationItem, showScore = false) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex space-x-4">
          {item.image_url ? (
            <div className="relative w-20 h-20 flex-shrink-0">
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-lg font-semibold text-gray-900">
                    ${item.price?.toFixed(2)}
                  </span>
                  {getStatusBadge(item.status)}
                  {getCategoryIcon(item.category)}
                </div>
                {showScore && (
                  <div className="flex items-center mt-1">
                    <Star className="h-3 w-3 text-yellow-500 mr-1" />
                    <span className="text-xs text-gray-500">Score: {item.score}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                {item.url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Buy
                    </a>
                  </Button>
                )}
                {item.category === 'slightly_over' && (
                  <Badge variant="outline" className="text-xs">
                    +{item.budget_proximity}% over budget
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">Loading recommendations...</p>
        </CardContent>
      </Card>
    )
  }

  if (!recommendations) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Budget Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">${budgetAmount}</div>
              <div className="text-sm text-gray-500">Your Budget</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.within_budget_count}</div>
              <div className="text-sm text-gray-500">Within Budget</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.alternatives_count}</div>
              <div className="text-sm text-gray-500">Alternatives</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Within Budget Recommendations */}
      {recommendations.within_budget.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle className="h-5 w-5 mr-2" />
              Perfect Matches ({recommendations.within_budget.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.within_budget.map(item => renderItemCard(item, true))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative Recommendations */}
      {recommendations.alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              Great Alternatives ({recommendations.alternatives.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                <p className="text-sm text-yellow-800">
                  These items are slightly over your budget but might be worth considering for special occasions.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {recommendations.alternatives.map(item => renderItemCard(item, true))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Recommendations */}
      {recommendations.within_budget.length === 0 && recommendations.alternatives.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
            <p className="text-gray-500">
              No items found within your budget of ${budgetAmount}. 
              Try increasing your budget or check back later for new items.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

