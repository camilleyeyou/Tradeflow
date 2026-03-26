import { createAdminClient } from '@/lib/supabase/admin'
import { deriveClientStatus, statusBadgeVariant } from '@/lib/types/admin'
import type { Client } from '@/lib/types/dashboard'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminClientsPage() {
  const supabase = createAdminClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  const clientList = (clients ?? []) as Client[]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link href="/admin/clients/new" className={buttonVariants()}>
          Add Client
        </Link>
      </div>

      <div className="rounded-md border bg-white">
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
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {client.business_name}
                      </Link>
                      {client.ghl_sub_account_id && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
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
                  <TableCell className="text-sm text-gray-500">
                    {new Date(client.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              )
            })}
            {clientList.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-500">
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
