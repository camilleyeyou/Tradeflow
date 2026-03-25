import { z } from 'zod'

export const settingsSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  notifications_enabled: z.boolean(),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>
