'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Bell, 
  UserPlus, 
  Gift, 
  MessageCircle, 
  Calendar,
  Check,
  CheckCheck,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface NotificationListProps {
  user: any
}

interface Notification {
  id: string
  type: 'friend_request' | 'registry_update' | 'budget_reminder' | 'event_reminder'
  content: string
  read: boolean
  created_at: string
  metadata: any
}

export default function NotificationList({ user }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
        toast.error('Failed to load notifications')
      } else {
        setNotifications(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    setMarkingRead(notificationId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        toast.error('Failed to mark notification as read')
      } else {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        )
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setMarkingRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        toast.error('Failed to mark all notifications as read')
      } else {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        toast.success('All notifications marked as read')
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('An unexpected error occurred')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-blue-600" />
      case 'registry_update':
        return <Gift className="h-4 w-4 text-green-600" />
      case 'budget_reminder':
        return <Calendar className="h-4 w-4 text-yellow-600" />
      case 'event_reminder':
        return <Calendar className="h-4 w-4 text-purple-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationAction = (notification: Notification) => {
    switch (notification.type) {
      case 'friend_request':
        return (
          <Button size="sm" variant="outline" asChild>
            <Link href="/friends?tab=requests">
              View Requests
            </Link>
          </Button>
        )
      case 'registry_update':
        if (notification.metadata?.registry_id) {
          return (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/registry/${notification.metadata.registry_id}`}>
                View Registry
              </Link>
            </Button>
          )
        }
        return null
      default:
        return null
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">Loading notifications...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Mark All Read */}
      {notifications.length > 0 && unreadCount > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-600">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-colors ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.read ? 'font-medium' : 'text-gray-600'}`}>
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {getNotificationAction(notification)}
                        
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markingRead === notification.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {notification.read && (
                          <div className="w-6 h-6 flex items-center justify-center">
                            <Check className="h-3 w-3 text-gray-400" />
                          </div>
                        )}
                      </div>
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

