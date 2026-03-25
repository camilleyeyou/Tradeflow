'use client'

import { useOptimistic, useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateLeadStatus } from '@/lib/actions/lead-actions'
import { LEAD_STATUSES } from '@/lib/types/dashboard'
import type { LeadStatus } from '@/lib/types/dashboard'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface StatusSelectProps {
  leadId: string
  currentStatus: string
}

export function StatusSelect({ leadId, currentStatus }: StatusSelectProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus)
  const [isPending, startTransition] = useTransition()

  function handleValueChange(newValue: LeadStatus | null) {
    if (!newValue) return
    startTransition(async () => {
      setOptimisticStatus(newValue)
      await updateLeadStatus(leadId, newValue as LeadStatus)
    })
  }

  return (
    <Select
      value={optimisticStatus as LeadStatus}
      onValueChange={handleValueChange}
      disabled={isPending}
    >
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {capitalize(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
