'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { onboardingSchema, type OnboardingFormValues } from '@/lib/validations/onboarding'
import { onboardClient } from '@/lib/actions/onboarding-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function NewClientPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      business_name: '',
      owner_name: '',
      email: '',
      phone: '',
      city: '',
      state: 'IL',
      service_area_zips: '',
      plan: 'starter',
    },
  })

  async function onSubmit(data: OnboardingFormValues) {
    setError(null)
    setPending(true)
    try {
      await onboardClient(data)
      // redirect happens in Server Action
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Add New Client</h1>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="business_name" className="mb-1 block text-sm font-medium">Business Name</label>
          <Input id="business_name" {...form.register('business_name')} placeholder="Oak Park HVAC" />
          {form.formState.errors.business_name && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.business_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="owner_name" className="mb-1 block text-sm font-medium">Owner Name</label>
          <Input id="owner_name" {...form.register('owner_name')} placeholder="John Smith" />
          {form.formState.errors.owner_name && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.owner_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <Input id="email" type="email" {...form.register('email')} placeholder="owner@example.com" />
          {form.formState.errors.email && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">Phone</label>
          <Input id="phone" type="tel" {...form.register('phone')} placeholder="(708) 555-1234" />
          {form.formState.errors.phone && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-medium">City</label>
            <Input id="city" {...form.register('city')} placeholder="Oak Park" />
            {form.formState.errors.city && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.city.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="state" className="mb-1 block text-sm font-medium">State</label>
            <Input id="state" {...form.register('state')} placeholder="IL" />
            {form.formState.errors.state && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.state.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="service_area_zips" className="mb-1 block text-sm font-medium">Service Area ZIP Codes</label>
          <Input id="service_area_zips" {...form.register('service_area_zips')} placeholder="60301, 60302, 60304" />
          <p className="mt-1 text-xs text-gray-500">Comma-separated ZIP codes</p>
          {form.formState.errors.service_area_zips && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.service_area_zips.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="plan" className="mb-1 block text-sm font-medium">Plan</label>
          <select
            id="plan"
            {...form.register('plan')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="premium">Premium</option>
          </select>
          {form.formState.errors.plan && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.plan.message}</p>
          )}
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Creating...' : 'Create Client'}
        </Button>
      </form>
    </div>
  )
}
