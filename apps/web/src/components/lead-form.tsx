'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leadSchema, type LeadFormValues, SERVICE_TYPES } from '@/lib/validations/lead'

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
      <div className="text-center py-8">
        <div className="text-green-600 text-4xl mb-4">&#10003;</div>
        <h3 className="text-xl font-bold mb-2">Thank You!</h3>
        <p className="text-gray-600">We&apos;ll call you within 5 minutes.</p>
      </div>
    )
  }

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
  const errorClass = 'text-red-500 text-sm mt-1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Hidden client_id field */}
      <input type="hidden" {...register('client_id')} />

      {/* Field 1: Name */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Your Name"
          className={inputClass}
          {...register('homeowner_name')}
        />
        {errors.homeowner_name && (
          <p className={errorClass}>{errors.homeowner_name.message}</p>
        )}
      </div>

      {/* Field 2: Phone */}
      <div className="mb-4">
        <input
          type="tel"
          placeholder="(555) 123-4567"
          className={inputClass}
          {...register('phone')}
        />
        {errors.phone && (
          <p className={errorClass}>{errors.phone.message}</p>
        )}
      </div>

      {/* Field 3: Service Type (pre-filled from URL) */}
      <div className="mb-4">
        <select className={inputClass} {...register('service_type')}>
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {SERVICE_OPTION_LABELS[type]}
            </option>
          ))}
        </select>
        {errors.service_type && (
          <p className={errorClass}>{errors.service_type.message}</p>
        )}
      </div>

      {/* Field 4: Zip Code */}
      <div className="mb-6">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="Zip Code"
          className={inputClass}
          {...register('zip_code')}
        />
        {errors.zip_code && (
          <p className={errorClass}>{errors.zip_code.message}</p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-lg transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Get My Free Quote'}
      </button>

      {/* Error message */}
      {errorMessage && (
        <p className={`${errorClass} text-center mt-3`}>{errorMessage}</p>
      )}
    </form>
  )
}
