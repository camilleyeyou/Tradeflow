'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leadSchema, type LeadFormValues, SERVICE_TYPES } from '@/lib/validations/lead'

const GOLD = '#D4AF37'

const SERVICE_OPTION_LABELS: Record<string, string> = {
  'ac-repair': 'AC Repair',
  'furnace-repair': 'Furnace Repair',
  'installation': 'HVAC Installation',
  'maintenance': 'HVAC Maintenance',
}

interface LeadFormProps {
  clientId: string
  serviceType: string
}

export default function LeadForm({ clientId, serviceType }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      client_id: clientId,
      service_type: serviceType as LeadFormValues['service_type'],
      homeowner_name: '',
      phone: '',
      zip_code: '',
    },
  })

  async function onSubmit(data: LeadFormValues) {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const body = await response.json()

      if (response.ok && body.success) {
        setIsSuccess(true)
      } else {
        setErrorMessage(body.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-8" role="status" aria-live="polite">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'rgba(34, 197, 94, 0.1)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-green-600"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-900">Request received</h3>
        <p className="text-slate-600">We&apos;ll call you within 5 minutes.</p>
        <p className="text-sm text-slate-500 mt-2">
          Watch for a call or text from a local 312 number.
        </p>
      </div>
    )
  }

  const baseInputClass =
    'w-full px-4 py-3 min-h-[44px] text-base bg-white border rounded-lg outline-none transition-colors placeholder:text-slate-400 focus:ring-2'
  const inputOk = 'border-slate-300 focus:border-slate-900'
  const inputError = 'border-red-500 bg-red-50 focus:border-red-600'

  function fieldClass(hasError: boolean) {
    return `${baseInputClass} ${hasError ? inputError : inputOk}`
  }

  const labelClass = 'block text-sm font-semibold text-slate-800 mb-1.5'
  const requiredMark = <span className="text-red-500" aria-hidden="true"> *</span>
  const errorClass = 'mt-1.5 text-sm text-red-600 flex items-start gap-1'

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ ['--tw-ring-color' as string]: 'rgba(212,175,55,0.4)' }}
    >
      {/* Hidden client_id field */}
      <input type="hidden" {...register('client_id')} />

      {/* Field 1: Name */}
      <div className="mb-4">
        <label htmlFor="homeowner_name" className={labelClass}>
          Your name{requiredMark}
        </label>
        <input
          id="homeowner_name"
          type="text"
          autoComplete="name"
          placeholder="Jane Smith"
          aria-invalid={!!errors.homeowner_name}
          aria-describedby={errors.homeowner_name ? 'homeowner_name-error' : undefined}
          className={fieldClass(!!errors.homeowner_name)}
          {...register('homeowner_name')}
        />
        {errors.homeowner_name && (
          <p id="homeowner_name-error" className={errorClass} role="alert">
            {errors.homeowner_name.message}
          </p>
        )}
      </div>

      {/* Field 2: Phone */}
      <div className="mb-4">
        <label htmlFor="phone" className={labelClass}>
          Phone number{requiredMark}
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="(555) 123-4567"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
          className={fieldClass(!!errors.phone)}
          {...register('phone')}
        />
        {errors.phone ? (
          <p id="phone-error" className={errorClass} role="alert">
            {errors.phone.message}
          </p>
        ) : (
          <p id="phone-hint" className="mt-1.5 text-xs text-slate-500">
            We&apos;ll call you back within 5 minutes.
          </p>
        )}
      </div>

      {/* Field 3: Service Type */}
      <div className="mb-4">
        <label htmlFor="service_type" className={labelClass}>
          Service needed{requiredMark}
        </label>
        <select
          id="service_type"
          aria-invalid={!!errors.service_type}
          aria-describedby={errors.service_type ? 'service_type-error' : undefined}
          className={fieldClass(!!errors.service_type)}
          {...register('service_type')}
        >
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {SERVICE_OPTION_LABELS[type]}
            </option>
          ))}
        </select>
        {errors.service_type && (
          <p id="service_type-error" className={errorClass} role="alert">
            {errors.service_type.message}
          </p>
        )}
      </div>

      {/* Field 4: Zip Code */}
      <div className="mb-6">
        <label htmlFor="zip_code" className={labelClass}>
          Zip code{requiredMark}
        </label>
        <input
          id="zip_code"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder="60601"
          aria-invalid={!!errors.zip_code}
          aria-describedby={errors.zip_code ? 'zip_code-error' : undefined}
          className={fieldClass(!!errors.zip_code)}
          {...register('zip_code')}
        />
        {errors.zip_code && (
          <p id="zip_code-error" className={errorClass} role="alert">
            {errors.zip_code.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-2 font-bold text-base py-3.5 px-6 min-h-12 rounded-lg text-slate-900 transition-all hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          background: GOLD,
          boxShadow: '0 4px 20px rgba(212,175,55,0.35)',
          ['--tw-ring-color' as string]: GOLD,
        }}
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-slate-900"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Submitting…
          </>
        ) : (
          <>Get my free quote &rarr;</>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-slate-500">
        No spam. Your info is only shared with the local technician.
      </p>

      {/* Server / network error */}
      {errorMessage && (
        <p
          className="mt-3 text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg py-2 px-3"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </form>
  )
}
