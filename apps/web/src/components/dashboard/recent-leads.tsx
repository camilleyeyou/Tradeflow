import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatChicagoTime } from '@/lib/utils/format'
import Link from 'next/link'
import type { Lead, LeadStatus } from '@/lib/types/dashboard'

interface RecentLeadsProps {
  leads: Lead[]
}

function getStatusVariant(status: LeadStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'new':
      return 'default'
    case 'contacted':
      return 'secondary'
    case 'booked':
      return 'outline'
    case 'completed':
      return 'default'
    case 'lost':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Recent Leads</h2>
      {leads.length === 0 ? (
        <p className="text-muted-foreground text-sm">No leads yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.homeowner_name ?? 'Unknown'}</TableCell>
                <TableCell>{lead.service_type ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(lead.status)}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatChicagoTime(lead.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Link
        href="/dashboard/leads"
        className="inline-block text-sm text-primary hover:underline"
      >
        View all leads →
      </Link>
    </section>
  )
}
