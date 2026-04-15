/**
 * Check if an email is an admin.
 * Reads from ADMIN_EMAILS (comma-separated) with ADMIN_EMAIL as fallback.
 */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const raw = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? ''
  const adminEmails = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}
