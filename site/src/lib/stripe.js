// Stripe flows go through Supabase Edge Functions so the secret key never
// touches the browser.
import { supabase } from './supabaseClient.js'
import { PLANS } from '../config.js'

function functionsUrl() {
  const base = import.meta.env.VITE_SUPABASE_URL
  if (!base) throw new Error('Supabase is not configured')
  return `${base.replace(/\/$/, '')}/functions/v1/stripe-checkout`
}

async function callFn(body) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('not-signed-in')
  const res = await fetch(functionsUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok || payload.error) throw new Error(payload.error || 'request-failed')
  return payload
}

// Start a Stripe Checkout subscription for a plan id ('monthly' | 'annual').
export async function startCheckout(planId) {
  const plan = PLANS[planId]
  if (!plan || !plan.stripePriceId) throw new Error('price-not-configured')
  const { url } = await callFn({ mode: 'checkout', priceId: plan.stripePriceId })
  window.location.href = url
}

// Open the Stripe customer billing portal (change plan, cancel, invoices).
export async function openBillingPortal() {
  const { url } = await callFn({ mode: 'portal' })
  window.location.href = url
}
