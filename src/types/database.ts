export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          subscription_status: 'free' | 'trial' | 'pro'
          subscription_ends_at: string | null
          created_at: string
          // Preferences
          language: 'en' | 'uk'
          timezone: string | null
          date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY'
          week_starts_on: 'monday' | 'sunday'
          // Notifications
          email_notifications: boolean
          daily_digest: boolean
          task_reminders: boolean
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'free' | 'trial' | 'pro'
          subscription_ends_at?: string | null
          created_at?: string
          language?: 'en' | 'uk'
          timezone?: string | null
          date_format?: 'DD/MM/YYYY' | 'MM/DD/YYYY'
          week_starts_on?: 'monday' | 'sunday'
          email_notifications?: boolean
          daily_digest?: boolean
          task_reminders?: boolean
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'free' | 'trial' | 'pro'
          subscription_ends_at?: string | null
          created_at?: string
          language?: 'en' | 'uk'
          timezone?: string | null
          date_format?: 'DD/MM/YYYY' | 'MM/DD/YYYY'
          week_starts_on?: 'monday' | 'sunday'
          email_notifications?: boolean
          daily_digest?: boolean
          task_reminders?: boolean
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: 'career' | 'health' | 'finance' | 'personal' | 'relationships' | null
          color: string
          target_date: string | null
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: 'career' | 'health' | 'finance' | 'personal' | 'relationships' | null
          color?: string
          target_date?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: 'career' | 'health' | 'finance' | 'personal' | 'relationships' | null
          color?: string
          target_date?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          title: string
          description: string | null
          due_date: string | null
          status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | null
          is_completed: boolean
          completed_at: string | null
          priority: 'low' | 'medium' | 'high'
          is_inbox: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | null
          is_completed?: boolean
          completed_at?: string | null
          priority?: 'low' | 'medium' | 'high'
          is_inbox?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | null
          is_completed?: boolean
          completed_at?: string | null
          priority?: 'low' | 'medium' | 'high'
          is_inbox?: boolean
          created_at?: string
          updated_at?: string
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
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']

export type GoalInsert = Database['public']['Tables']['goals']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
