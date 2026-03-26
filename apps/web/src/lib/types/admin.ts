export type ClientStatus = 'active' | 'trial' | 'inactive'

export function deriveClientStatus(client: {
  is_active: boolean
  trial_ends_at: string | null
}): ClientStatus {
  if (!client.is_active) return 'inactive'
  if (client.trial_ends_at && new Date(client.trial_ends_at) > new Date()) return 'trial'
  return 'active'
}

export function statusBadgeVariant(status: ClientStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active': return 'default'
    case 'trial': return 'secondary'
    case 'inactive': return 'destructive'
  }
}
