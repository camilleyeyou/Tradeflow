'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { settingsSchema, type SettingsFormValues } from '@/lib/validations/settings'
import { updateClientSettings } from '@/lib/actions/settings-actions'
import type { Client } from '@/lib/types/dashboard'

interface SettingsFormProps {
  client: Client
}

export function SettingsForm({ client }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      business_name: client.business_name,
      phone: client.phone,
      email: client.email,
      city: client.city,
      notifications_enabled: client.notifications_enabled,
    },
  })

  function onSubmit(data: SettingsFormValues) {
    setMessage(null)
    startTransition(async () => {
      try {
        await updateClientSettings(data)
        setMessage({ type: 'success', text: 'Settings saved' })
      } catch (e) {
        setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Something went wrong' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Business Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="business_name">
                Business Name
              </label>
              <Input
                id="business_name"
                {...register('business_name')}
              />
              {errors.business_name && (
                <p className="text-sm text-destructive">{errors.business_name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="phone">
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="city">
                City
              </label>
              <Input
                id="city"
                {...register('city')}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Notification Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium" htmlFor="notifications_enabled">
              Email me when a new lead comes in
            </label>
            <Controller
              control={control}
              name="notifications_enabled"
              render={({ field }) => (
                <Switch
                  id="notifications_enabled"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="space-y-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>

        {/* Success/Error feedback */}
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  )
}
