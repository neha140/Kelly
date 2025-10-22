export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
      }
      friendships: {
        Row: {
          id: string
          created_at: string
          requester_id: string
          addressee_id: string
          status: 'pending' | 'accepted' | 'declined'
        }
        Insert: {
          id?: string
          created_at?: string
          requester_id: string
          addressee_id: string
          status?: 'pending' | 'accepted' | 'declined'
        }
        Update: {
          id?: string
          created_at?: string
          requester_id?: string
          addressee_id?: string
          status?: 'pending' | 'accepted' | 'declined'
        }
      }
      posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          content: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          content?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          content?: string | null
          image_url?: string | null
        }
      }
      post_likes: {
        Row: {
          id: string
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          post_id?: string
          user_id?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          post_id: string
          user_id: string
          content: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          post_id: string
          user_id: string
          content: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          post_id?: string
          user_id?: string
          content?: string
        }
      }
      registries: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          title: string
          event_date: string | null
          access_level: 'public' | 'friends' | 'private'
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          title: string
          event_date?: string | null
          access_level?: 'public' | 'friends' | 'private'
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          title?: string
          event_date?: string | null
          access_level?: 'public' | 'friends' | 'private'
          description?: string | null
        }
      }
      registry_items: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          registry_id: string
          title: string
          description: string | null
          price: number | null
          url: string | null
          image_url: string | null
          status: 'available' | 'reserved' | 'purchased'
          purchased_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          registry_id: string
          title: string
          description?: string | null
          price?: number | null
          url?: string | null
          image_url?: string | null
          status?: 'available' | 'reserved' | 'purchased'
          purchased_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          registry_id?: string
          title?: string
          description?: string | null
          price?: number | null
          url?: string | null
          image_url?: string | null
          status?: 'available' | 'reserved' | 'purchased'
          purchased_by?: string | null
        }
      }
      budgets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          friend_id: string
          registry_id: string | null
          amount: number
          currency: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          friend_id: string
          registry_id?: string | null
          amount: number
          currency?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          friend_id?: string
          registry_id?: string | null
          amount?: number
          currency?: string
        }
      }
      registry_item_comments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          item_id: string
          user_id: string
          content: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          item_id: string
          user_id: string
          content: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          item_id?: string
          user_id?: string
          content?: string
        }
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          user_id: string
          type: 'friend_request' | 'registry_update' | 'budget_reminder' | 'event_reminder'
          content: string
          read: boolean
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          type: 'friend_request' | 'registry_update' | 'budget_reminder' | 'event_reminder'
          content: string
          read?: boolean
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          type?: 'friend_request' | 'registry_update' | 'budget_reminder' | 'event_reminder'
          content?: string
          read?: boolean
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
