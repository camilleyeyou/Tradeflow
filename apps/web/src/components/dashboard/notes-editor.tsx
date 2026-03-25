'use client'

import { useState, useTransition, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateLeadNotes } from '@/lib/actions/lead-actions'

interface NotesEditorProps {
  leadId: string
  initialNotes: string | null
}

export function NotesEditor({ leadId, initialNotes }: NotesEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function saveNotes() {
    setIsEditing(false)
    startTransition(() => updateLeadNotes(leadId, notes))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveNotes()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  function startEditing() {
    setIsEditing(true)
    // Focus textarea on next render
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={saveNotes}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        className="min-w-48 text-sm"
        rows={2}
        autoFocus
      />
    )
  }

  const displayText = notes.length > 100 ? notes.slice(0, 100) + '...' : notes

  return (
    <div className="flex items-center gap-2">
      <span className={notes ? 'text-sm' : 'text-sm text-muted-foreground'}>
        {notes ? displayText : 'Add notes...'}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={startEditing}
        disabled={isPending}
        className="h-6 px-2 text-xs"
      >
        Edit
      </Button>
    </div>
  )
}
