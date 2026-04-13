'use server'

import { createAdminClient } from '@/lib/supabase/admin'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = 'Tf@'
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createClientLogin(
  clientId: string,
  email: string,
): Promise<{ tempPassword: string } | { error: string }> {
  const supabase = createAdminClient()

  // Check if a login already exists
  const { data: existing } = await supabase
    .from('client_users')
    .select('user_id')
    .eq('client_id', clientId)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'A login already exists for this client.' }
  }

  const tempPassword = generateTempPassword()

  // Create the Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Failed to create auth user.' }
  }

  // Link user to client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: linkError } = await supabase
    .from('client_users')
    .insert({ user_id: authData.user.id, client_id: clientId, role: 'owner' } as any)

  if (linkError) {
    // Clean up the orphaned auth user
    await supabase.auth.admin.deleteUser(authData.user.id)
    return { error: linkError.message }
  }

  return { tempPassword }
}
