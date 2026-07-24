// Schema-accurate types hand-authored from migrations 001-005 (Phase 5 DPLY-01).
// Reconcile with 'supabase gen types typescript' against the live project post-deploy
// (see .planning/phases/05-critical-security-launch-blockers/DEPLOY-CHECKLIST.md).

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
      clients: {
        Row: {
          id: string
          business_name: string
          owner_name: string
          email: string
          phone: string
          city: string
          state: string
          service_area_zips: string[]
          ghl_sub_account_id: string | null
          callrail_tracking_number: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: string
          is_active: boolean
          trial_ends_at: string | null
          created_at: string
          slug: string
          notifications_enabled: boolean
          ghl_private_token_encrypted: string | null
          review_rating: number | null
          review_count: number | null
          trade: string
          google_review_url: string | null
          review_requests_enabled: boolean
          timezone: string
        }
        Insert: {
          id?: string
          business_name: string
          owner_name: string
          email: string
          phone: string
          city: string
          state?: string
          service_area_zips?: string[]
          ghl_sub_account_id?: string | null
          callrail_tracking_number?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: string
          is_active?: boolean
          trial_ends_at?: string | null
          created_at?: string
          slug: string
          notifications_enabled?: boolean
          ghl_private_token_encrypted?: string | null
          review_rating?: number | null
          review_count?: number | null
          trade?: string
          google_review_url?: string | null
          review_requests_enabled?: boolean
          timezone?: string
        }
        Update: {
          id?: string
          business_name?: string
          owner_name?: string
          email?: string
          phone?: string
          city?: string
          state?: string
          service_area_zips?: string[]
          ghl_sub_account_id?: string | null
          callrail_tracking_number?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: string
          is_active?: boolean
          trial_ends_at?: string | null
          created_at?: string
          slug?: string
          notifications_enabled?: boolean
          ghl_private_token_encrypted?: string | null
          review_rating?: number | null
          review_count?: number | null
          trade?: string
          google_review_url?: string | null
          review_requests_enabled?: boolean
          timezone?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          client_id: string
          homeowner_name: string | null
          phone: string | null
          email: string | null
          zip_code: string | null
          service_type: string | null
          source: string | null
          status: string
          lead_score: number | null
          notes: string | null
          ghl_contact_id: string | null
          callrail_call_id: string | null
          created_at: string
          contacted_at: string | null
          booked_at: string | null
          completed_at: string | null
          first_contact_at: string | null
          urgency_score: number | null
          urgency_reason: string | null
          review_requested_at: string | null
          job_value_cents: number | null
        }
        Insert: {
          id?: string
          client_id: string
          homeowner_name?: string | null
          phone?: string | null
          email?: string | null
          zip_code?: string | null
          service_type?: string | null
          source?: string | null
          status?: string
          lead_score?: number | null
          notes?: string | null
          ghl_contact_id?: string | null
          callrail_call_id?: string | null
          created_at?: string
          contacted_at?: string | null
          booked_at?: string | null
          completed_at?: string | null
          first_contact_at?: string | null
          urgency_score?: number | null
          urgency_reason?: string | null
          review_requested_at?: string | null
          job_value_cents?: number | null
        }
        Update: {
          id?: string
          client_id?: string
          homeowner_name?: string | null
          phone?: string | null
          email?: string | null
          zip_code?: string | null
          service_type?: string | null
          source?: string | null
          status?: string
          lead_score?: number | null
          notes?: string | null
          ghl_contact_id?: string | null
          callrail_call_id?: string | null
          created_at?: string
          contacted_at?: string | null
          booked_at?: string | null
          completed_at?: string | null
          first_contact_at?: string | null
          urgency_score?: number | null
          urgency_reason?: string | null
          review_requested_at?: string | null
          job_value_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          id: string
          client_id: string
          lead_id: string | null
          callrail_call_id: string | null
          caller_number: string | null
          tracking_number: string | null
          duration_seconds: number | null
          recording_url: string | null
          transcript: string | null
          outcome: string | null
          called_at: string
        }
        Insert: {
          id?: string
          client_id: string
          lead_id?: string | null
          callrail_call_id?: string | null
          caller_number?: string | null
          tracking_number?: string | null
          duration_seconds?: number | null
          recording_url?: string | null
          transcript?: string | null
          outcome?: string | null
          called_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          lead_id?: string | null
          callrail_call_id?: string | null
          caller_number?: string | null
          tracking_number?: string | null
          duration_seconds?: number | null
          recording_url?: string | null
          transcript?: string | null
          outcome?: string | null
          called_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_sequences: {
        Row: {
          id: string
          lead_id: string
          touch_number: number
          message_body: string
          ghl_message_id: string | null
          status: string
          scheduled_at: string
          sent_at: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          touch_number: number
          message_body: string
          ghl_message_id?: string | null
          status?: string
          scheduled_at: string
          sent_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          touch_number?: number
          message_body?: string
          ghl_message_id?: string | null
          status?: string
          scheduled_at?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_sequences_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      billing: {
        Row: {
          id: string
          client_id: string
          stripe_invoice_id: string | null
          stripe_subscription_id: string | null
          amount_cents: number
          currency: string
          status: string
          period_start: string | null
          period_end: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          amount_cents: number
          currency?: string
          status: string
          period_start?: string | null
          period_end?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          amount_cents?: number
          currency?: string
          status?: string
          period_start?: string | null
          period_end?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          user_id: string
          client_id: string
          role: string
        }
        Insert: {
          user_id: string
          client_id: string
          role?: string
        }
        Update: {
          user_id?: string
          client_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
