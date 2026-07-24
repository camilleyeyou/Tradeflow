import { z } from 'zod'
import { TIMEZONE_VALUES } from '@/lib/timezones'

export const onboardingSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  owner_name: z.string().min(2, 'Owner name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  state: z.string().min(1, 'State is required'),
  service_area_zips: z.string().min(1, 'At least one ZIP code required'),
  plan: z.enum(['starter', 'growth', 'premium']),
  trade: z.enum(['hvac', 'plumbing']),
  ghl_private_token: z.string().trim().optional().or(z.literal('')),
  timezone: z.enum(TIMEZONE_VALUES),
})

export type OnboardingFormValues = z.infer<typeof onboardingSchema>
