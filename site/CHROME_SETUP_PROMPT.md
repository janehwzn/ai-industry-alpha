# Claude-in-Chrome prompt: buy domain, deploy, verify

Copy everything below the line into your Claude Chrome agent. It buys
`aialpha.news` on Porkbun, deploys this repo's site to it via GitHub Pages,
and inspects the live site against the feature checklist.

---

You are helping me launch my website. Work in three phases, and report the
result of each phase before moving to the next. Ask me before any payment,
account creation, or entering personal details — never invent them.

## Context

- GitHub repo: `janehwzn/ai-industry-alpha` (public, branch `main`)
- `site/` contains a Vite + React site (Seeking Alpha-style AI news +
  subscription product). A `Deploy site` GitHub Actions workflow builds it
  and deploys to GitHub Pages. The build already succeeds; the deploy step
  fails only because GitHub Pages is not enabled yet.
- Domain to buy: `aialpha.news` on Porkbun (~$9.78 for the first year).
- Supabase (login/database) and Stripe (payments) are NOT connected yet —
  expect login, paid checkout, and newsletter signup to show their
  "not connected yet" states. That is normal; just verify the UI states.

## Phase 1 — Buy aialpha.news on Porkbun

1. Go to porkbun.com. Log in, or create an account (ask me for the email /
   details you need).
2. Search for `aialpha.news`, add a 1-year registration to the cart.
   Decline all paid add-ons (WHOIS privacy is free — keep it).
3. At checkout, STOP and show me the cart total and registrant details.
   Only complete the purchase after I explicitly approve.
4. Confirm the domain appears under your Porkbun domains.

## Phase 2 — Deploy the site to the domain

1. GitHub repo `janehwzn/ai-industry-alpha` → Settings → Pages →
   Build and deployment → Source: **GitHub Actions**.
2. Actions → "Deploy site" workflow → re-run the latest run (or Run workflow)
   → wait until it is green. Report the Pages URL
   (expected: `https://janehwzn.github.io/ai-industry-alpha/`) and confirm it loads.
3. Back in Settings → Pages → Custom domain: enter `aialpha.news` and save.
4. GitHub will show the DNS records it needs. In Porkbun, open DNS for
   `aialpha.news` and add exactly those records (follow GitHub's instructions,
   don't guess).
5. Wait for DNS to propagate and for "Enforce HTTPS" to become available;
   enable it. Confirm `https://aialpha.news` loads with a valid certificate.

## Phase 3 — Inspect the live site and verify features

Visit `https://aialpha.news` and check each item. For each: pass/fail plus a
one-line note (and screenshot if it fails).

1. Homepage loads: top ticker tape animates, masthead shows logo + nav
   (Latest / Signal Ledger / Pricing), hero strip with tagline.
2. Headlines feed: ~86 stories listed newest-first, with a large Top Story card.
3. Click a headline → article page shows summary and a "Read the full story"
   outbound link to the source.
4. Search box filters the headline list as you type.
5. "Signal Ledger" page: 3 thesis cards, each badged "Members only".
6. Open a thesis while logged out → you see a blurred excerpt plus an
   "Unlock the Signal Ledger" paywall with See plans / Sign in buttons
   (full text must NOT be visible).
7. Pricing page: Free ($0) vs Premium cards, $9.99/month and $99/year.
   Since Stripe isn't connected, the Premium card must show the waitlist
   email form — not a checkout button.
8. Newsletter signup (sidebar): form is present; submitting shows the
   "backend not connected" note (expected for now).
9. Language toggle (EN/中文 in the header) switches the navigation labels.
10. Account page while logged out shows a "please sign in" prompt.
11. Resize to a phone-width viewport: layout stacks vertically, no overlapping
    text or broken buttons.
12. Open devtools console on the homepage: note any red errors.

## Ground rules

- Payments, account creation, and personal details: always ask me first.
- Do not change prices, copy, or code — deploy and verify only. If something
  is broken, report exactly what and where instead of fixing it.
- Give me the URL and status at the end of each phase before continuing.

## Known follow-ups (not your job today)

After I connect Supabase/Stripe keys later: Supabase Auth Site URL and
redirect URLs must change to `https://aialpha.news`, and the
`SITE_URL` edge-function secret must be updated. Just mention this in your
final report as a reminder.
