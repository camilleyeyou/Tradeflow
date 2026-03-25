import { z } from 'zod'

export const SERVICE_TYPES = ['ac-repair', 'furnace-repair', 'installation', 'maintenance'] as const

export const leadSchema = z.object({
  client_id: z.string().uuid('Invalid client'),
  homeowner_name: z.string().min(2, 'Please enter your name').max(100, 'Name too long'),
  phone: z.string().regex(/^\+?1?\d{10}$/, 'Enter a valid 10-digit US phone number'),
  service_type: z.enum(SERVICE_TYPES, { error: 'Select a service type' }),
  zip_code: z.string().regex(/^\d{5}$/, 'Enter a valid 5-digit zip code'),
})

export type LeadFormValues = z.infer<typeof leadSchema>
