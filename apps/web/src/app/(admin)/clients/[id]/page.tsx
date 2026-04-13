import { createAdminClient } from '@/lib/supabase/admin'
import { deriveClientStatus, statusBadgeVariant } from '@/lib/types/admin'
import type { Client, Lead, Call } from '@/lib/types/dashboard'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import CreateLoginButton from './create-login-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  // Fetch client
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) notFound()
  const typedClient = client as Client
  const status = deriveClientStatus(typedClient)

  // Fetch recent leads (last 20) per D-57
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const leadsList = (leads ?? []) as Lead[]

  // Fetch recent calls (last 20) per D-57
  const { data: calls } = await supabase
    .from('calls')
    .select('*')
    .eq('client_id', id)
    .order('called_at', { ascending: false })
    .limit(20)

  const callsList = (calls ?? []) as Call[]

  // GHL sub-account dashboard link
  const ghlLink = typedClient.ghl_sub_account_id
    ? `https://app.gohighlevel.com/location/${typedClient.ghl_sub_account_id}`
    : null

  // Check if client has a linked auth user via client_users
  const { data: clientUsers } = await supabase
    .from('client_users')
    .select('user_id')
    .eq('client_id', id)
    .limit(1)

  const hasAuthUser = (clientUsers ?? []).length > 0

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/clients" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; All Clients
        </Link>
      </div>

      {!hasAuthUser && (
        <div className="mb-6">
          <CreateLoginButton
            clientId={typedClient.id}
            email={typedClient.email as string}
            ownerName={typedClient.owner_name as string}
          />
        </div>
      )}

      {/* Client Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{typedClient.business_name}</CardTitle>
            <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Owner</dt>
              <dd>{typedClient.owner_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd>{typedClient.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd>{typedClient.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">City</dt>
              <dd>{typedClient.city}, {typedClient.state}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Plan</dt>
              <dd className="capitalize">{typedClient.plan}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Service Area ZIPs</dt>
              <dd>{Array.isArray(typedClient.service_area_zips) ? typedClient.service_area_zips.join(', ') : typedClient.service_area_zips}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">GHL Sub-Account</dt>
              <dd>
                {ghlLink ? (
                  <a href={ghlLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Open in GHL &rarr;
                  </a>
                ) : (
                  <span className="text-amber-600">Not provisioned</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Stripe Customer</dt>
              <dd>{typedClient.stripe_customer_id ?? <span className="text-gray-400">Not linked</span>}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Client ID</dt>
              <dd className="font-mono text-xs text-gray-500">{typedClient.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd>{new Date(typedClient.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Recent Leads Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Recent Leads ({leadsList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {leadsList.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No leads yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsList.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.homeowner_name ?? '—'}</TableCell>
                    <TableCell>{lead.phone ?? '—'}</TableCell>
                    <TableCell>{lead.service_type ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Calls Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Calls ({callsList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {callsList.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No calls yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caller</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callsList.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>{call.caller_number ?? '—'}</TableCell>
                    <TableCell>{call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}` : '—'}</TableCell>
                    <TableCell>{call.outcome ?? '—'}</TableCell>
                    <TableCell>
                      {call.recording_url ? (
                        <a href={call.recording_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Listen
                        </a>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(call.called_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
