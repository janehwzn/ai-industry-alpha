// Central product configuration. Prices are the only thing you need to
// touch to change the paywall; everything else reads from here.
export const SITE = {
  name: 'AI Industry Alpha',
  shortName: 'AIA',
  tagline: 'Know which AI shifts matter — before they become consensus.',
  contactEmail: 'hello@aialpha.news',
  // Public GitHub repo (subscribe bot, issues)
  repoUrl: 'https://github.com/janehwzn/ai-industry-alpha',
}

export const PLANS = {
  monthly: {
    id: 'monthly',
    price: 9.99,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || '',
  },
  annual: {
    id: 'annual',
    price: 99,
    interval: 'year',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ANNUAL || '',
  },
}

export const stripeConfigured =
  Boolean(PLANS.monthly.stripePriceId) && Boolean(PLANS.annual.stripePriceId)

// Premium = the paid "Signal Ledger": weekly startup theses + angle briefs.
// Free   = daily headlines feed + free weekly digest email.
export const PREMIUM_FEATURES = [
  'Weekly startup theses (3 angles, bilingual)',
  'Angle-based briefs: money, talent, compute, cost curves',
  'Quarterly AI sector maps',
  'Full Signal Ledger archive',
]

export const FREE_FEATURES = [
  'Daily AI headlines feed',
  'Free weekly digest email',
  'Source links to every story',
]
