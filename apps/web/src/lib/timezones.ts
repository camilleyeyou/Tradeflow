// TIMEZONE-CONFIG: curated list of US timezones offered in settings and
// admin onboarding. Pure data module — no imports, no 'server-only'
// directive — so both Server and Client Components can import it (mirrors
// trades.ts).

export interface TimezoneOption {
  value: string
  label: string
}

export const US_TIMEZONES: TimezoneOption[] = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (AZ)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AK)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HI)' },
]

export const TIMEZONE_VALUES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
] as const

export const DEFAULT_TIMEZONE = 'America/Chicago'
