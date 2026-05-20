import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getStartedSchema } from '@/lib/validations/get-started'

const TO_EMAIL = 'hello@tradeflow-technologies.com'
const CC_EMAIL = 'contact@tradeflow-technologies.com'
const FROM_EMAIL = process.env.GET_STARTED_FROM_EMAIL ?? 'no-reply@tradeflow-technologies.com'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^1/, '')
  if (digits.length !== 10) return phone
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const result = getStartedSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Please check your entries and try again.', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const { full_name, company_name, phone, email, service_area, heard_from } = result.data

  if (!process.env.RESEND_API_KEY) {
    console.error('[get-started] RESEND_API_KEY is not configured')
    return NextResponse.json(
      { error: 'Email service is not configured.', code: 'CONFIG_ERROR' },
      { status: 500 }
    )
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const prettyPhone = formatPhone(phone)

  const rows: Array<[string, string]> = [
    ['Full name', full_name],
    ['Company', company_name],
    ['Phone', prettyPhone],
    ['Email', email],
    ['Service area', service_area],
    ['Heard about us via', heard_from],
  ]

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0a0a0a;max-width:560px;">
      <h2 style="margin:0 0 4px;font-size:18px;">New Tradeflow inquiry</h2>
      <p style="margin:0 0 20px;color:#555;font-size:13px;">Submitted from /get-started</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;width:160px;color:#555;">${escapeHtml(label)}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(value)}</td>
              </tr>`
          )
          .join('')}
      </table>
      <p style="margin-top:20px;font-size:12px;color:#888;">Reply directly to this email to reach ${escapeHtml(full_name)}.</p>
    </div>
  `

  const text = [
    'New Tradeflow inquiry (from /get-started)',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join('\n')

  try {
    const { error } = await resend.emails.send({
      from: `Tradeflow Inquiries <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      cc: CC_EMAIL,
      replyTo: email,
      subject: `New Tradeflow inquiry — ${company_name} (${full_name})`,
      html,
      text,
    })

    if (error) {
      console.error('[get-started] Resend error:', error)
      return NextResponse.json(
        { error: 'Could not send your message. Please try again.', code: 'EMAIL_ERROR' },
        { status: 502 }
      )
    }
  } catch (err) {
    console.error('[get-started] Unexpected Resend error:', err)
    return NextResponse.json(
      { error: 'Could not send your message. Please try again.', code: 'EMAIL_ERROR' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
