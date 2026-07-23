// AI-01: Claude-based lead urgency scoring.
// Server-only module — never import from client components. Resilient by
// design: returns null (no-op) whenever the API key is unset, the call
// times out, or the response cannot be parsed, so a failure here never
// affects lead capture. Invoked from the lead-submit route's after()
// background block, after the homeowner's 200 has already been returned.

import Anthropic from '@anthropic-ai/sdk'
import { getTradeConfig } from '@/lib/trades'

export interface LeadScoringInput {
  service_type: string
  message?: string | null
  source: string
  created_at: string
  trade?: string
}

export interface UrgencyResult {
  score: number
  reason: string
}

function buildSystemPrompt(trade?: string): string {
  const cfg = getTradeConfig(trade)
  return `You are triaging inbound ${cfg.scoringDomain} leads by urgency. Given the lead data, respond with ONLY a strict JSON object of the exact shape {"score": <integer 1-10>, "reason": "<short string>"} and nothing else. 10 = emergency (e.g. ${cfg.scoringEmergencyExamples}), 1 = low intent. Do not include markdown or prose.`
}

export async function scoreLeadUrgency(
  input: LeadScoringInput
): Promise<UrgencyResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null // feature disabled — skip gracefully

  try {
    const client = new Anthropic({ apiKey })
    const resp = await client.messages.create(
      {
        model: 'claude-fable-5',
        max_tokens: 200,
        temperature: 0,
        system: buildSystemPrompt(input.trade),
        messages: [{ role: 'user', content: JSON.stringify(input) }],
      },
      { timeout: 8000 }
    )

    const block = resp.content.find((b) => b.type === 'text')
    const text = block && block.type === 'text' ? block.text : ''
    const match = text.match(/\{[\s\S]*\}/) // defensive: extract first JSON object
    if (!match) return null

    const parsed = JSON.parse(match[0]) as { score?: unknown; reason?: unknown }
    const score = Math.max(1, Math.min(10, Math.round(Number(parsed.score))))
    if (!Number.isFinite(score)) return null

    const reason = typeof parsed.reason === 'string' ? parsed.reason.slice(0, 500) : ''
    return { score, reason }
  } catch (err) {
    console.error('[scoring] scoreLeadUrgency error:', err)
    return null
  }
}
