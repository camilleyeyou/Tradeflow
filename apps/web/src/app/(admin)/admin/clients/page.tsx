import { createAdminClient } from '@/lib/supabase/admin'
import { deriveClientStatus, statusBadgeVariant } from '@/lib/types/admin'
import type { Client } from '@/lib/types/dashboard'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'

const GOLD = '#D4AF37'

export const dynamic = 'force-dynamic'

export default async function AdminClientsPage() {
  // Guard: make sure required env vars exist before hitting Supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <ErrorState
        title="Missing environment variables"
        detail={`Missing: ${[
          !process.env.NEXT_PUBLIC_SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
          !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
        ].filter(Boolean).join(', ')}`}
        hint="Set these in Vercel > Project > Settings > Environment Variables, then redeploy."
      />
    )
  }

  let clientList: Client[] = []
  let fetchError: string | null = null

  try {
    const supabase = createAdminClient()
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      fetchError = `${error.message}${error.code ? ` (${error.code})` : ''}`
    } else {
      clientList = (clients ?? []) as Client[]
    }
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Unknown error'
  }

  if (fetchError) {
    return (
      <ErrorState
        title="Database error"
        detail={fetchError}
        hint="Check that the 'clients' table exists in Supabase and the service role key has access."
      />
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link href="/admin/clients/new" className={buttonVariants()}>
          Add Client
        </Link>
      </div>

      <div className="rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Stripe</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientList.map((client) => {
              const status = deriveClientStatus(client)
              return (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="font-medium hover:underline"
                        style={{ color: GOLD }}
                      >
                        {client.business_name}
                      </Link>
                      {client.ghl_sub_account_id && (
                        <Badge variant="outline" className="text-xs text-green-400 border-green-900">
                          GHL
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{client.city}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(status)}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{client.plan}</TableCell>
                  <TableCell>
                    {client.stripe_customer_id ? (
                      <Badge variant="outline">Connected</Badge>
                    ) : (
                      <Badge variant="secondary">Not linked</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-white/40">
                    {new Date(client.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              )
            })}
            {clientList.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-white/40">
                  No clients yet. Add your first client to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ErrorState({ title, detail, hint }: { title: string; detail: string; hint: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clients</h1>
      <div
        className="rounded-xl p-6"
        style={{
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <h2 className="text-red-400 font-semibold mb-2">{title}</h2>
        <p className="text-white/70 text-sm mb-3 font-mono">{detail}</p>
        <p className="text-white/40 text-sm">{hint}</p>
      </div>
    </div>
  )
}
