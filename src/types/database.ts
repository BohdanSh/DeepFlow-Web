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
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'free' | 'trial' | 'pro'
          subscription_ends_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'free' | 'trial' | 'pro'
          subscription_ends_at?: string | null
          created_at?: string
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
      projects: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          title: string
          description: string | null
          status: 'active' | 'completed' | 'on_hold'
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          title: string
          description?: string | null
          status?: 'active' | 'completed' | 'on_hold'
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          title?: string
          description?: string | null
          status?: 'active' | 'completed' | 'on_hold'
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          goal_id: string | null
          title: string
          description: string | null
          due_date: string | null
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
          project_id?: string | null
          goal_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
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
          project_id?: string | null
          goal_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
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
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']

export type GoalInsert = Database['public']['Tables']['goals']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
