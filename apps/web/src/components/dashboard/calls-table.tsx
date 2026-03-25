import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatChicagoTime, truncatePhone, formatDuration } from '@/lib/utils/format'
import type { Call } from '@/lib/types/dashboard'

interface CallsTableProps {
  calls: Call[]
}

function getOutcomeVariant(outcome: string | null): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (outcome) {
    case 'answered':
      return 'default'
    case 'missed':
      return 'destructive'
    case 'voicemail':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function CallsTable({ calls }: CallsTableProps) {
  if (calls.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
        No calls recorded yet. Calls tracked via CallRail will appear here.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Caller</TableHead>
            <TableHead className="hidden md:table-cell">Duration</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Recording</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow key={call.id}>
              <TableCell>
                {call.caller_number ? truncatePhone(call.caller_number) : '—'}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDuration(call.duration_seconds)}
              </TableCell>
              <TableCell>
                {call.outcome ? (
                  <Badge variant={getOutcomeVariant(call.outcome)}>
                    {call.outcome.charAt(0).toUpperCase() + call.outcome.slice(1)}
                  </Badge>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                {call.recording_url ? (
                  <a
                    href={call.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Play
                  </a>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatChicagoTime(call.called_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
