export const LEAD_STATUSES = ['new', 'contacted', 'booked', 'completed', 'lost'] as const
export type LeadStatus = typeof LEAD_STATUSES[number]

export interface Lead {
  id: string
  client_id: string
  homeowner_name: string | null
  phone: string | null
  email: string | null
  zip_code: string | null
  service_type: string | null
  source: string | null
  status: LeadStatus
  lead_score: number | null
  notes: string | null
  ghl_contact_id: string | null
  callrail_call_id: string | null
  created_at: string
  contacted_at: string | null
  booked_at: string | null
  completed_at: string | null
}

export interface Call {
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

export interface Client {
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
  notifications_enabled: boolean
  created_at: string
}

export interface StatusCounts {
  new: number
  contacted: number
  booked: number
  completed: number
}
