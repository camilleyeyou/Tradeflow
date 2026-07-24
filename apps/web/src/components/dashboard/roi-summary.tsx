import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Timer } from 'lucide-react'

// Estimated value per lead (USD) — conservative booked-job estimate; clearly
// labeled "estimated" in the UI. Used only for completed leads that lack a
// real reported job_value_cents (JOB-VALUE).
export const ESTIMATED_LEAD_VALUE = 400

interface RoiSummaryProps {
  monthLeadCount: number
  reportedValueDollars: number
  estimatedValueDollars: number
  avgSpeedToLeadMinutes: number | null
}

export function RoiSummary({
  monthLeadCount,
  reportedValueDollars,
  estimatedValueDollars,
  avgSpeedToLeadMinutes,
}: RoiSummaryProps) {
  const total = reportedValueDollars + estimatedValueDollars

  let displayValue: number
  let subtitle: string

  if (reportedValueDollars > 0 && estimatedValueDollars > 0) {
    displayValue = total
    subtitle = `$${reportedValueDollars.toLocaleString()} reported + $${estimatedValueDollars.toLocaleString()} estimated`
  } else if (reportedValueDollars > 0) {
    displayValue = reportedValueDollars
    subtitle = 'Reported job value'
  } else {
    displayValue = estimatedValueDollars
    subtitle = `Estimated at $${ESTIMATED_LEAD_VALUE}/lead — not actual revenue`
  }

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
          <p className="text-3xl font-bold">${displayValue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
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
