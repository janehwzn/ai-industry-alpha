# AI Industry Alpha — site setup guide

The site code is done and deploys itself. What remains is connecting three
free-tier accounts: **Supabase** (login + database), **Stripe** (payments),
and flipping one switch for **GitHub Pages** (hosting). Newsletter sending
already works through the existing Gmail digest pipeline.

> ⏱️ About 30–45 minutes, most of it clicking through dashboards.
> Do it in order — each step unlocks the next.

---

## Step 1 — Supabase: database + login (10 min)

1. Go to https://supabase.com → **New project**. Name it `ai-industry-alpha`,
   pick any region, set a database password (save it somewhere safe).
2. Wait for provisioning (~2 min). Open **SQL Editor** → **New query**,
   paste the entire contents of `site/supabase/schema.sql`, run it.
   This creates `newsletter_subscribers`, `profiles`, `subscriptions` (+ RLS).
3. **Authentication → Sign In / Up**: make sure **Email** provider is ON.
4. **Enable Google sign-in** (the site's "Continue with Google" button needs this):
   - Go to https://console.cloud.google.com → **APIs & Services → Credentials → Create Credentials → OAuth client ID** (type: Web application).
   - Under **Authorized redirect URIs**, add:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
     (the project ref is the subdomain of your Supabase Project URL).
   - Copy the **Client ID** and **Client secret**.
   - Back in Supabase: **Authentication → Providers → Google → Enable**,
     paste the Client ID + secret, save.
5. **Authentication → URL Configuration**:
   - Site URL: `https://aialpha.news`
   - Add to **Redirect URLs**:
     `https://aialpha.news/#/auth/callback`
6. **Project Settings → API**: copy the **Project URL** and **anon public** key.
   Also copy the **service_role** key (needed for the sync script + functions).

## Step 2 — Supabase Edge Functions: checkout + webhook (10 min)

Install the CLI once: `npm install -g supabase`, then:

```bash
cd site
supabase login
supabase link --project-ref <your-project-ref>   # ref is in the Project URL
supabase secrets set STRIPE_SECRET_KEY=sk_test_... SITE_URL=https://aialpha.news
# (webhook secret comes from Step 3 — set it after)
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

> `--no-verify-jwt` on the webhook is required — Stripe's servers, not a
> logged-in user, call that endpoint.

## Step 3 — Stripe: prices + webhook (10 min)

Start in **test mode** (toggle in the Dashboard sidebar) so no real money moves.

1. **Product catalog → Add product**: name `AI Industry Alpha Premium`,
   add two prices: **$9.99/month recurring** and **$99/year recurring**.
   Copy both **price IDs** (`price_...`).
2. **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`
   - Copy the **signing secret** (`whsec_...`), then:
     `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
3. Test: in the site, sign in with your email, go to Pricing, click a plan —
   use card `4242 4242 4242 4242`. After checkout you should land on Account
   showing **Premium**. Then **flip to live mode** and repeat steps 1–3 with
   live keys when ready to take real payments.

## Step 4 — GitHub secrets (5 min)

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value | Enables |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | login, signup |
| `VITE_SUPABASE_ANON_KEY` | anon public key | login, signup |
| `VITE_STRIPE_PRICE_MONTHLY` | `price_...` monthly | paid checkout |
| `VITE_STRIPE_PRICE_ANNUAL` | `price_...` annual | paid checkout |
| `SUPABASE_URL` | Supabase project URL | newsletter sync |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | newsletter sync |

The existing `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `RECIPIENT` secrets stay as-is.

## Step 5 — GitHub Pages: flip the switch (1 min)

Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The `Deploy site` workflow runs on the next push to `main` (or **Run workflow**
manually). The site goes live at:

**https://janehwzn.github.io/ai-industry-alpha/**

## Step 6 — Newsletter: already wired

- Signup forms on the site write to Supabase `newsletter_subscribers`.
- `digest.yml` now runs `site/scripts/sync-subscribers.py` before sending,
  merging new signups into `subscribers.txt` (needs the `SUPABASE_*` secrets
  from Step 4; silently skips without them).
- The Gmail SMTP send is unchanged — new subscribers get the next digest.

## Step 7 — Custom domain `aialpha.news` ✅ done

Already live. If you ever need to redo it:

1. Porkbun → DNS: `CNAME` for `@`/`www` pointing at `janehwzn.github.io`.
2. Repo → **Settings → Pages → Custom domain**: `aialpha.news`, enforce HTTPS.
3. Supabase → **Authentication → URL Configuration**: Site URL
   `https://aialpha.news`, Redirect URLs include
   `https://aialpha.news/#/auth/callback`.
4. `supabase secrets set SITE_URL=https://aialpha.news` and redeploy
   `stripe-checkout`.

---

## Test checklist

- [ ] Home loads headlines, search filters them
- [ ] Newsletter signup → row appears in Supabase `newsletter_subscribers`
- [ ] Sign in → **Continue with Google** → Google consent → lands on Account page
- [ ] Sign in → magic-link email arrives → lands on Account page
- [ ] Pricing → checkout (test card) → Account shows Premium, thesis unlocks
- [ ] Stripe Dashboard → webhook deliveries show `200`
- [ ] Billing portal opens from Account → cancel → status flips on next sync

## Before taking real payments

- Flip Stripe to **live mode** and redo Step 3 with live keys/secrets.
- Review Salesforce's outside-employment, conflict, confidentiality and
  IP-assignment policies — running a paid product alongside employment
  needs that cleared first.

## Changing prices later

Edit `src/config.js` (`PLANS`), create the new prices in Stripe, update the
two `VITE_STRIPE_PRICE_*` secrets. Existing subscribers keep their old price
until they change plans (Stripe default).
