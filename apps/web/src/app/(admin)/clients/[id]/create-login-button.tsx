'use client'

import { useState, useTransition } from 'react'
import { createClientLogin } from '@/lib/actions/create-client-login'
import { Button } from '@/components/ui/button'

interface Props {
  clientId: string
  email: string
  ownerName: string
}

export default function CreateLoginButton({ clientId, email, ownerName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ tempPassword: string } | { error: string } | null>(null)

  function handleClick() {
    startTransition(async () => {
      const res = await createClientLogin(clientId, email)
      setResult(res)
    })
  }

  if (result && 'tempPassword' in result) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800 mb-2">
          Login created for {ownerName}
        </p>
        <p className="text-sm text-green-700 mb-1">
          Email: <span className="font-mono font-semibold">{email}</span>
        </p>
        <p className="text-sm text-green-700">
          Temp password:{' '}
          <span className="font-mono font-semibold bg-green-100 px-1.5 py-0.5 rounded">
            {result.tempPassword}
          </span>
        </p>
        <p className="mt-2 text-xs text-green-600">
          Share these credentials with the client. They can change their password after first login.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-800 mb-3">
        {ownerName} does not have a login yet.
      </p>
      {'error' in (result ?? {}) && (
        <p className="text-sm text-red-600 mb-2">
          {(result as { error: string }).error}
        </p>
      )}
      <Button
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className="bg-amber-700 hover:bg-amber-800 text-white"
      >
        {isPending ? 'Creating login…' : 'Create login for this client'}
      </Button>
    </div>
  )
}
