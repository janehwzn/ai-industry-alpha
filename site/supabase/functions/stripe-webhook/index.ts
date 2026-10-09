// Supabase Edge Function: stripe-webhook
// Receives Stripe webhook events and mirrors subscription state into
// public.subscriptions, which the site reads to unlock premium content.
//
// Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
//          (--no-verify-jwt is REQUIRED: Stripe, not a Supabase user, calls this)
// Secrets:  supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
// Stripe Dashboard > Developers > Webhooks > Add endpoint:
//   URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Events: checkout.session.completed, customer.subscription.updated,
//           customer.subscription.deleted

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-11-20.acacia',
})
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

function asId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return new Response(`bad signature: ${message}`, { status: 400 })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session
      const userId =
        s.metadata?.supabase_user_id ??
        (s.subscription as Stripe.Subscription | null)?.metadata?.supabase_user_id
      const subId = asId(s.subscription)
      let status = 'active'
      let periodEnd: string | null = null
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId)
        status = sub.status
        periodEnd = new Date(sub.current_period_end * 1000).toISOString()
      }
      if (userId && subId) {
        await admin.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: asId(s.customer),
            stripe_subscription_id: subId,
            status,
            tier: 'premium',
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_subscription_id' },
        )
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object as Stripe.Subscription
      const patch = {
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }
      const userId = sub.metadata?.supabase_user_id
      if (userId) {
        await admin.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: asId(sub.customer),
            stripe_subscription_id: sub.id,
            tier: 'premium',
            ...patch,
          },
          { onConflict: 'stripe_subscription_id' },
        )
      } else {
        await admin.from('subscriptions').update(patch).eq('stripe_subscription_id', sub.id)
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return new Response(`handler error: ${message}`, { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
