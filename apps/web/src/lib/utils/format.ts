/**
 * Format ISO timestamp in America/Chicago timezone (per D-47)
 */
export function formatChicagoTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Truncate phone number for display (per CLAUDE.md security: truncated PII in logs)
 * Input: '+13125551234' or '3125551234'
 * Output: '+1312****1234'
 */
export function truncatePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `+1${digits.slice(1, 4)}****${digits.slice(-4)}`
  }
  if (digits.length === 10) {
    return `+1${digits.slice(0, 3)}****${digits.slice(-4)}`
  }
  return '****'
}

/**
 * Format call duration from seconds to mm:ss
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
