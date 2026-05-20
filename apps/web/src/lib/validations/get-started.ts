import { z } from 'zod'

export const HEARD_FROM_OPTIONS = ['Google', 'Referral', 'Social Media', 'Other'] as const

export const getStartedSchema = z.object({
  full_name: z.string().min(2, 'Please enter your full name').max(100, 'Name too long'),
  company_name: z.string().min(2, 'Please enter your company name').max(120, 'Company name too long'),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\+?1?\d{10}$/, 'Enter a valid 10-digit US phone number')),
  email: z.string().email('Enter a valid email address').max(160),
  service_area: z
    .string()
    .min(2, 'Enter your primary service area or zip code')
    .max(120, 'Too long'),
  heard_from: z.enum(HEARD_FROM_OPTIONS, { error: 'Tell us how you heard about us' }),
})

export type GetStartedFormValues = z.input<typeof getStartedSchema>
export type GetStartedFormData = z.output<typeof getStartedSchema>
