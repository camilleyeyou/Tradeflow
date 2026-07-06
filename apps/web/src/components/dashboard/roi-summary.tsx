import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Timer } from 'lucide-react'

// Estimated value per lead (USD) — conservative booked-job estimate; clearly
// labeled "estimated" in the UI. Not a real revenue figure — leads.notes /
// booking status are not yet tied to actual invoice amounts (see billing table).
export const ESTIMATED_LEAD_VALUE = 400

interface RoiSummaryProps {
  monthLeadCount: number
  estimatedValue: number
  avgSpeedToLeadMinutes: number | null
}

export function RoiSummary({ monthLeadCount, estimatedValue, avgSpeedToLeadMinutes }: RoiSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            <CardTitle>Leads This Month</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{monthLeadCount}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-500" />
            <CardTitle>Estimated Value</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${estimatedValue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Estimated at ${ESTIMATED_LEAD_VALUE}/lead — not actual revenue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-amber-500" />
            <CardTitle>Avg Speed to Lead</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {avgSpeedToLeadMinutes !== null ? `${avgSpeedToLeadMinutes} min` : '—'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
