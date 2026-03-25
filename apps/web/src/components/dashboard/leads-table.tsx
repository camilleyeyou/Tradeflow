'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusSelect } from './status-select'
import { NotesEditor } from './notes-editor'
import { formatChicagoTime, truncatePhone } from '@/lib/utils/format'
import type { Lead } from '@/lib/types/dashboard'

interface LeadsTableProps {
  leads: Lead[]
}

export function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6">
        No leads yet. Leads from your landing page will appear here.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Phone</TableHead>
            <TableHead>Service Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                {lead.homeowner_name ?? 'Unknown'}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {lead.phone ? truncatePhone(lead.phone) : '-'}
              </TableCell>
              <TableCell>{lead.service_type ?? '-'}</TableCell>
              <TableCell>
                <StatusSelect
                  leadId={lead.id}
                  currentStatus={lead.status}
                />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatChicagoTime(lead.created_at)}
              </TableCell>
              <TableCell>
                <NotesEditor
                  leadId={lead.id}
                  initialNotes={lead.notes}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
