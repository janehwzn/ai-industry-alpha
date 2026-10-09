# Claude-in-Chrome prompt: connect Stripe for premium subscriptions

Copy everything below the line into your Claude Chrome agent. It creates the
Stripe products/prices, the webhook, stores everything as secrets, and
verifies a test purchase end-to-end on the live site.

---

You are helping me turn on paid subscriptions for my website. Work in six
phases, and report the result of each phase before moving to the next.
Ask me before any account creation, payment, or entering personal details —
never invent them. Never print API keys, secrets, or tokens in chat; copy
them directly from one field to another. STAY IN TEST MODE the whole time
unless I explicitly say otherwise — never enter real card details.

## Context

- Live site: `https://aialpha.news` (GitHub repo `janehwzn/ai-industry-alpha`,
  public, branch `main`). Pricing page offers Free ($0) vs Premium
  ($9.99/month, $99/year). The site code is complete: it calls a Supabase
  Edge Function `stripe-checkout` to start checkout / open the billing
  portal, and `stripe-webhook` receives Stripe events to mark subscriptions
  in the database. Nothing is connected yet, so Pricing currently shows a
  waitlist form instead of checkout buttons.
- Supabase project ref: `hznooqfjfzomvbspvuba`
  (Project URL `https://hznooqfjfzomvbspvuba.supabase.co`).
- The two Edge Functions already exist in the repo under
  `site/supabase/functions/` (`stripe-checkout`, `stripe-webhook`).
  Deploying their code needs the Supabase CLI, which you cannot run —
  Phase 5 gives me the exact commands to paste.
- Do not change any code — dashboards only.

## Phase 1 — Stripe: product + prices (TEST mode)

1. Go to dashboard.stripe.com. Log in (use the browser's saved login; ask me
   if you need anything). Confirm the **Test mode** toggle (sidebar) is ON.
   If I have no Stripe account yet, ASK ME before creating one.
2. **Product catalog → Add product**: name `AI Industry Alpha Premium`.
   Add two recurring prices:
   - **$9.99 / month**, recurring monthly
   - **$99 / year**, recurring yearly
3. Copy both **price IDs** (`price_...`) — paste them directly into GitHub
   in Phase 3, never into chat.

## Phase 2 — Stripe: webhook (TEST mode)

1. **Developers → Webhooks → Add endpoint**:
   - URL: `https://hznooqfjfzomvbspvuba.supabase.co/functions/v1/stripe-webhook`
   - Events to send: `checkout.session.completed`,
     `customer.subscription.updated`, `customer.subscription.deleted`
2. Copy the endpoint's **signing secret** (`whsec_...`) — you will need it
   in Phase 4. Never print it in chat.

## Phase 3 — GitHub: price secrets + rebuild

1. github.com/janehwzn/ai-industry-alpha → **Settings → Secrets and
   variables → Actions → New repository secret**. Add:
   - `VITE_STRIPE_PRICE_MONTHLY` = the $9.99/mo price ID from Phase 1
   - `VITE_STRIPE_PRICE_ANNUAL` = the $99/yr price ID from Phase 1
   (paste directly; never print the values)
2. **Actions → "Deploy site" → Run workflow** → wait until green.
   (Vite embeds `VITE_*` at build time, so this redeploy is what turns the
   checkout buttons on.)

## Phase 4 — Supabase: Edge Function secrets

1. Supabase dashboard → project `ai-industry-alpha` → **Project Settings →
   Edge Functions → Secrets** (if you cannot find this page, skip it —
   Phase 5 covers secrets via CLI instead). Add:
   - `STRIPE_SECRET_KEY` = the **test** secret key (`sk_test_...`,
     from Stripe Dashboard → Developers → API keys)
   - `STRIPE_WEBHOOK_SECRET` = the `whsec_...` from Phase 2
   - `SITE_URL` = `https://aialpha.news`
2. Confirm each secret is saved (do not show me the values).

## Phase 5 — Handoff: CLI commands for me

You cannot run a terminal, so give me the exact commands to paste, in order,
with a one-line explanation of each. Use these values:

```bash
npm install -g supabase
cd site
supabase login
supabase link --project-ref hznooqfjfzomvbspvuba
# (link will ask for the database password I set when creating the project)
supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... SITE_URL=https://aialpha.news
# (skip any secret already set via the dashboard in Phase 4; fill in the real values)
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

Tell me to run them and report back when done. Do NOT proceed to Phase 6
until I confirm the deploys succeeded.

## Phase 6 — Verify a test purchase end-to-end

Visit `https://aialpha.news` (hard-refresh) and check each item —
pass/fail plus a one-line note:

1. Pricing page: the Premium card now shows **two checkout buttons**
   ($9.99/month and $99/year) instead of the waitlist form.
2. Sign in first (use **Continue with Google** if it works; otherwise send
   a magic link to an email I monitor and ASK ME to click it — you cannot
   read my inbox).
3. Click the **$9.99/month** button → a Stripe Checkout page opens (it may be
   `checkout.stripe.com`, that is expected).
4. Pay with the test card `4242 4242 4242 4242`, any future expiry, any CVC.
   Complete the checkout → you must land back on the site.
5. Open **Account**: it shows the **Premium** badge (not Free).
6. Open **Signal Ledger → the third thesis** (orbital compute): the full
   text is now visible instead of the paywall. (The first two theses are
   free samples and were visible before — no change there.)
7. In **Account**, click **Manage billing** → the Stripe customer portal
   opens. (Do NOT cancel the test subscription — leave it for me, or ask
   me first.)
8. Stripe Dashboard → **Developers → Webhooks**: the recent deliveries for
   `checkout.session.completed` show HTTP `200`.

## Ground rules

- Test mode only. Real card details: never.
- Account creation, payments, personal details: always ask me first.
- Never print keys/secrets/tokens/price IDs in chat or in your report —
  confirm each was *set* without showing its value.
- Do not change code, prices, or copy — dashboards only. If something is
  broken, report exactly what and where instead of fixing it.
- End of each phase: report what was done and wait for my go-ahead.

## Known follow-ups (not your job today)

- Flipping to **live mode** later: repeat Phases 1–2 with the Live toggle
  on, set the live keys/secrets, redeploy. Before taking real payments I
  must review my employer's outside-employment / conflict / IP policies.
- If the Site URL ever changes, update `SITE_URL` in the function secrets
  and the webhook URL stays the same (it points at Supabase, not the site).
