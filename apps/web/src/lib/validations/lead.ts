import { z } from 'zod'
import { ALL_SERVICE_SLUGS } from '@/lib/trades'

// Re-exported so existing importers keep compiling; the flat slug list now
// spans every trade's services (source of truth: @/lib/trades).
export const SERVICE_TYPES = ALL_SERVICE_SLUGS

export const leadSchema = z.object({
  client_id: z.string().uuid('Invalid client'),
  homeowner_name: z.string().min(2, 'Please enter your name').max(100, 'Name too long'),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\+?1?\d{10}$/, 'Enter a valid 10-digit US phone number')),
  service_type: z.enum(ALL_SERVICE_SLUGS, { error: 'Select a service type' }),
  zip_code: z.string().regex(/^\d{5}$/, 'Enter a valid 5-digit zip code'),
})

export type LeadFormValues = z.input<typeof leadSchema>
