'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateLeadJobValue } from '@/lib/actions/lead-actions'
import type { LeadStatus } from '@/lib/types/dashboard'

const MAX_JOB_VALUE_DOLLARS = 1_000_000

interface JobValueEditorProps {
  leadId: string
  initialCents: number | null
  status: LeadStatus
}

function centsToDollarsString(cents: number | null): string {
  return cents === null ? '' : String(cents / 100)
}

export function JobValueEditor({ leadId, initialCents, status }: JobValueEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(centsToDollarsString(initialCents))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function saveValue() {
    const trimmed = value.trim()

    if (trimmed === '') {
      setError(null)
      setIsEditing(false)
      startTransition(() => updateLeadJobValue(leadId, null))
      return
    }

    const dollars = Number(trimmed)
    if (!Number.isFinite(dollars) || dollars < 0) {
      setError('Enter a valid, non-negative dollar amount')
      return
    }
    if (dollars > MAX_JOB_VALUE_DOLLARS) {
      setError('Job value is too large')
      return
    }

    const cents = Math.round(dollars * 100)
    setError(null)
    setIsEditing(false)
    startTransition(() => updateLeadJobValue(leadId, cents))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveValue()
    }
    if (e.key === 'Escape') {
      setValue(centsToDollarsString(initialCents))
      setError(null)
      setIsEditing(false)
    }
  }

  const isCompleted = status === 'completed'
  const displayValue = value.trim() === '' ? null : Number(value)
  const displayText =
    displayValue !== null && Number.isFinite(displayValue)
      ? `$${displayValue.toLocaleString()}`
      : 'Not set'

  const labelClassName = isCompleted
    ? 'text-sm text-muted-foreground'
    : 'text-xs text-muted-foreground'
  const valueClassName = isCompleted ? 'text-lg font-semibold' : 'text-sm'

  return (
    <div className="flex flex-col gap-1">
      <p className={labelClassName}>Job value</p>
      {isEditing ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={MAX_JOB_VALUE_DOLLARS}
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={saveValue}
              onKeyDown={handleKeyDown}
              disabled={isPending}
              className="w-28"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={valueClassName}>{displayText}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={isPending}
            className="h-6 px-2 text-xs"
          >
            Edit
          </Button>
        </div>
      )}
    </div>
  )
}
