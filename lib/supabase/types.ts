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
      users: {
        Row: {
          id: string
          email: string
          name: string
          initials: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          initials: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          initials?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
        }
      }
      games: {
        Row: {
          id: string
          group_id: string
          stakes: string
          default_buy_in: number
          bank_person_id: string
          is_completed: boolean
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          stakes: string
          default_buy_in: number
          bank_person_id: string
          is_completed?: boolean
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stakes?: string
          default_buy_in?: number
          bank_person_id?: string
          is_completed?: boolean
          updated_at?: string
        }
      }
      game_players: {
        Row: {
          id: string
          game_id: string
          user_id: string
          buy_in: number
          cash_out: number
          profit: number
          opted_in_at: string
          rebuy_count: number
          rebuy_amount: number
          has_cashed_out: boolean
          cashed_out_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          buy_in: number
          cash_out?: number
          profit?: number
          opted_in_at?: string
          rebuy_count?: number
          rebuy_amount?: number
          has_cashed_out?: boolean
          cashed_out_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buy_in?: number
          cash_out?: number
          profit?: number
          opted_in_at?: string
          rebuy_count?: number
          rebuy_amount?: number
          has_cashed_out?: boolean
          cashed_out_at?: string | null
          updated_at?: string
        }
      }
      game_player_payments: {
        Row: {
          id: string
          game_id: string
          user_id: string
          is_paid: boolean
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          is_paid?: boolean
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_paid?: boolean
          paid_at?: string | null
          updated_at?: string
        }
      }
      settlements: {
        Row: {
          id: string
          game_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          is_paid: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          is_paid?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          amount?: number
          is_paid?: boolean
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