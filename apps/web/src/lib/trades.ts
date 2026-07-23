// TRADE-CONFIG: single source of truth for per-trade service slugs, labels,
// default service, and AI-scoring copy. Pure data module — no 'server-only'
// directive, no imports — so both Server and Client Components can import it.

export type Trade = 'hvac' | 'plumbing'

export interface ServiceDef {
  slug: string
  label: string
}

export interface TradeConfig {
  trade: Trade
  label: string
  defaultService: string
  services: ServiceDef[]
  scoringDomain: string
  scoringEmergencyExamples: string
  /** schema.org LocalBusiness subtype used for JSON-LD structured data. */
  schemaType: string
}

export const TRADES: Record<Trade, TradeConfig> = {
  hvac: {
    trade: 'hvac',
    label: 'HVAC',
    defaultService: 'ac-repair',
    services: [
      { slug: 'ac-repair', label: 'AC Repair' },
      { slug: 'furnace-repair', label: 'Furnace Repair' },
      { slug: 'installation', label: 'HVAC Installation' },
      { slug: 'maintenance', label: 'HVAC Maintenance' },
    ],
    scoringDomain: 'HVAC',
    scoringEmergencyExamples: 'no heat or AC in extreme weather',
    schemaType: 'HVACBusiness',
  },
  plumbing: {
    trade: 'plumbing',
    label: 'Plumbing',
    defaultService: 'emergency-plumbing',
    services: [
      { slug: 'drain-cleaning', label: 'Drain Cleaning' },
      { slug: 'water-heater-repair', label: 'Water Heater Repair' },
      { slug: 'leak-repair', label: 'Leak Repair' },
      { slug: 'emergency-plumbing', label: 'Emergency Plumbing' },
    ],
    scoringDomain: 'plumbing',
    scoringEmergencyExamples: 'a burst pipe, active flooding, or no hot water',
    schemaType: 'Plumber',
  },
}

/** Returns the trade config for a given trade value, defaulting to hvac
 * for unknown/missing values so every existing/legacy client keeps working. */
export function getTradeConfig(trade: string | null | undefined): TradeConfig {
  return TRADES[trade as Trade] ?? TRADES.hvac
}

/** Looks up a service label within a trade's services, falling back to the
 * raw slug when not found. */
export function getServiceLabel(trade: string | null | undefined, slug: string): string {
  const cfg = getTradeConfig(trade)
  return cfg.services.find((s) => s.slug === slug)?.label ?? slug
}

export function isValidServiceForTrade(trade: string | null | undefined, slug: string): boolean {
  const cfg = getTradeConfig(trade)
  return cfg.services.some((s) => s.slug === slug)
}

// Flat list of every service slug across every trade — for callers that
// need to validate ANY service slug regardless of trade (e.g. the shared
// lead form schema). Must stay in sync with TRADES above.
export const ALL_SERVICE_SLUGS = [
  'ac-repair',
  'furnace-repair',
  'installation',
  'maintenance',
  'drain-cleaning',
  'water-heater-repair',
  'leak-repair',
  'emergency-plumbing',
] as const
