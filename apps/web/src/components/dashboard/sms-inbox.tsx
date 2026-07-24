'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatClientTime } from '@/lib/utils/format'

interface SmsMessage {
  id: string
  direction: 'inbound' | 'outbound'
  body: string
  dateAdded: string
}

interface SmsInboxProps {
  leadId: string
  timeZone: string
}

export function SmsInbox({ leadId, timeZone }: SmsInboxProps) {
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/messages`)
      if (!res.ok) {
        setError('Could not load messages.')
        return
      }
      const data = await res.json() as { messages?: SmsMessage[] }
      setMessages(data.messages ?? [])
    } catch {
      setError('Could not load messages.')
    }
  }, [leadId])

  useEffect(() => {
    setIsLoading(true)
    loadMessages().finally(() => setIsLoading(false))
  }, [loadMessages])

  async function handleSend() {
    const message = draft.trim()
    if (!message || isSending) return

    setIsSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/leads/${leadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json().catch(() => ({})) as { success?: boolean }
      if (!res.ok || !data.success) {
        setError('Message failed to send. Please try again.')
        return
      }
      setDraft('')
      await loadMessages()
    } catch {
      setError('Message failed to send. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="max-h-96 min-h-32 space-y-2 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={
                m.direction === 'outbound'
                  ? 'ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                  : 'mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground'
              }
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              {m.dateAdded ? (
                <p className="mt-1 text-[10px] opacity-70">
                  {formatClientTime(m.dateAdded, timeZone)}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a reply..."
          rows={2}
          disabled={isSending}
          className="w-full flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={isSending || draft.trim().length === 0}
          className="w-full sm:w-auto"
        >
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
