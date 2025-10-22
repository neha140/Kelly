'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: 'friend_request' | 'registry_update' | 'budget_reminder' | 'event_reminder'
  content: string
  read: boolean
  created_at: string
  metadata: any
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

export function useNotifications(userId: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) {
        throw fetchError
      }

      setNotifications(data || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (updateError) {
        throw updateError
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (updateError) {
        throw updateError
      }

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      setError('Failed to mark all notifications as read')
    }
  }

  const refreshNotifications = async () => {
    await fetchNotifications()
  }

  useEffect(() => {
    if (userId) {
      fetchNotifications()

      // Set up real-time subscription
      const supabase = createClient()
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Notification change:', payload)
            
            if (payload.eventType === 'INSERT') {
              // Add new notification
              setNotifications(prev => [payload.new as Notification, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              // Update existing notification
              setNotifications(prev => 
                prev.map(notif => 
                  notif.id === payload.new.id 
                    ? payload.new as Notification
                    : notif
                )
              )
            } else if (payload.eventType === 'DELETE') {
              // Remove notification
              setNotifications(prev => 
                prev.filter(notif => notif.id !== payload.old.id)
              )
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  }
}

