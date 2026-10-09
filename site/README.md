# AI Industry Alpha — website

Seeking Alpha-style subscription site for the AI Industry Alpha product:
daily AI headlines feed, premium Signal Ledger (weekly startup theses),
magic-link login, free newsletter signup, and Stripe paid subscriptions.

## Stack

| Layer | Tech | Cost |
|---|---|---|
| Frontend | Vite + React, static build | free |
| Hosting | GitHub Pages (Actions deploy) | free |
| Auth + DB | Supabase (magic-link email login) | free tier |
| Payments | Stripe Checkout + webhooks via Supabase Edge Functions | 2.9% + 30¢ per txn |
| Newsletter sending | existing Gmail SMTP digest pipeline | free |

No server to run. The two Edge Functions are the only backend code.

## Local dev

```bash
cd site
cp .env.example .env   # fill in your Supabase URL + anon key
python3 scripts/build-data.py   # regenerate public/data/*.json
npm install
npm run dev
```

## What lives where

- `src/` — React app (pages: Home, Article, Theses, Thesis, Pricing, Account)
- `scripts/build-data.py` — digest outputs → `public/data/*.json`
- `scripts/sync-subscribers.py` — Supabase signups → `subscribers.txt` (runs in digest.yml)
- `supabase/schema.sql` — tables + RLS (run once in Supabase SQL Editor)
- `supabase/functions/stripe-checkout` — creates Checkout + billing-portal sessions
- `supabase/functions/stripe-webhook` — Stripe → `subscriptions` table mirror
- `../.github/workflows/site.yml` — build + deploy to GitHub Pages

## Prices

Change in `src/config.js` (`PLANS`) and in the Stripe Dashboard (price IDs go
in `.env` / GitHub secrets as `VITE_STRIPE_PRICE_MONTHLY` / `_ANNUAL`).
Current defaults: **$9.99/mo, $99/yr**.

## Full setup guide

See `SETUP.md` — Supabase, Stripe, GitHub secrets, Pages, custom domain.
