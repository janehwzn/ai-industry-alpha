// Supabase Edge Function: stripe-checkout
// Creates Stripe Checkout sessions (new subscriptions) and billing-portal
// sessions (manage/cancel). The Stripe SECRET key never touches the browser.
//
// Deploy:  supabase functions deploy stripe-checkout
// Secrets:  supabase secrets set STRIPE_SECRET_KEY=sk_live_... SITE_URL=https://aialpha.news
// (Keep JWT verification ON — this function is called by logged-in users.)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-11-20.acacia',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return json({ error: 'not-signed-in' }, 401)

    const { mode, priceId } = await req.json()
    const siteUrl = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: existing } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const customerId: string | undefined = existing?.stripe_customer_id ?? undefined

    if (mode === 'portal') {
      if (!customerId) return json({ error: 'no-subscription' }, 400)
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${siteUrl}/#/account`,
      })
      return json({ url: portal.url })
    }

    if (mode !== 'checkout' || !priceId) return json({ error: 'bad-request' }, 400)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      customer_email: customerId ? undefined : (user.email ?? undefined),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
      success_url: `${siteUrl}/#/account`,
      cancel_url: `${siteUrl}/#/pricing`,
    })
    return json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return json({ error: message }, 500)
  }
})
