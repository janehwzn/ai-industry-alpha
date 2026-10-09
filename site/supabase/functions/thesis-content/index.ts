// Supabase Edge Function: thesis-content
// Serves the full body of a locked Signal Ledger thesis ONLY to verified
// premium subscribers. The public theses.json carries just metadata +
// excerpt for locked theses, so the paywall is real: full bodies live in
// theses-full.json bundled with this function and never ship to browsers
// except through here.
//
// Deploy:  supabase functions deploy thesis-content
// (Keep JWT verification ON — the function checks the subscription itself.)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

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

let cache: Array<Record<string, unknown>> | null = null
async function loadTheses() {
  if (!cache) {
    const text = await Deno.readTextFile(
      new URL('./theses-full.json', import.meta.url),
    )
    cache = JSON.parse(text)
  }
  return cache
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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: sub } = await admin
      .from('subscriptions')
      .select('status,current_period_end')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const premium =
      !!sub &&
      ['active', 'trialing'].includes(sub.status) &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date())
    if (!premium) return json({ error: 'not-premium' }, 403)

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return json({ error: 'missing-id' }, 400)
    const theses = await loadTheses()
    const thesis = theses.find((t) => t.id === id)
    if (!thesis) return json({ error: 'not-found' }, 404)
    return json({ thesis })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return json({ error: message }, 500)
  }
})
