// Centralized pricing (CHF) and formatter

export const formatCHF = (n: number) =>
  n.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })

// Escorts
export const PRICING_ESCORTS = {
  membership: { basis: 24.9, plus: 49.9, premium: 89.9 },
  dayAddon: { 1: 12.9, 3: 29.9, 7: 39.9 },
  weekAddon: { 1: 39.9, 2: 69.9 },
  monthAddon: { 1: 99, 2: 169 },
  cityBoost: { 7: 29.9, 14: 49.9, 30: 79 },
} as const

// Members (Visitors)
export const PRICING_MEMBERS = {
  membership: { basis: 0, plus: 7.9, premium: 14.9 },
  dayAddon: { 1: 1.9, 3: 3.9, 7: 6.9 },
  cityBoost: { 7: 2.9, 14: 4.9, 30: 7.9 },
} as const

// Agencies
export const PRICING_AGENCIES = {
  membership: { basis: 79, plus: 129, premium: 199 },
  dayAddon: { 1: 19, 3: 39, 7: 69 },
  weekAddon: { 1: 99, 2: 179 },
  monthAddon: { 1: 349, 2: 599 },
  cityBoost: { 7: 49, 14: 89, 30: 149 },
} as const

// Clubs
export const PRICING_CLUBS = {
  membership: { basis: 59, plus: 99, premium: 159 },
  dayAddon: { 1: 14.9, 3: 29.9, 7: 49.9 },
  weekAddon: { 1: 79, 2: 129 },
  cityBoost: { 7: 39, 14: 69, 30: 109 },
} as const

// Studios
export const PRICING_STUDIOS = {
  membership: { basis: 49, plus: 89, premium: 139 },
  dayAddon: { 1: 12.9, 3: 24.9, 7: 39.9 },
  weekAddon: { 1: 69, 2: 109 },
  cityBoost: { 7: 29.9, 14: 49.9, 30: 89 },
} as const
