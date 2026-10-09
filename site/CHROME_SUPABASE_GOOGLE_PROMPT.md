# Claude-in-Chrome prompt: connect Supabase + Google sign-in

Copy everything below the line into your Claude Chrome agent. It creates the
Supabase backend, enables Google OAuth, stores the keys as GitHub secrets,
and verifies sign-in works on the live site.

---

You are helping me connect the backend for my website's sign-in. Work in
five phases, and report the result of each phase before moving to the next.
Ask me before any account creation, payment, or entering personal details —
never invent them. Never print API keys, secrets, or tokens in chat; copy
them directly from one field to another.

## Context

- Live site: `https://aialpha.news` (GitHub repo `janehwzn/ai-industry-alpha`,
  public, branch `main`). The sign-in modal has a **Continue with Google**
  button plus a magic-link email form. Neither works yet — Supabase was never
  connected, so the modal currently shows its "not connected yet" state.
- Database schema: `site/supabase/schema.sql` in the repo — fetch the raw file
  from `https://raw.githubusercontent.com/janehwzn/ai-industry-alpha/main/site/supabase/schema.sql`.
  It creates `newsletter_subscribers`, `profiles`, `subscriptions` (+ RLS).
- The site is a static SPA with hash routing. After login Supabase redirects
  to `https://aialpha.news/#/auth/callback`, which exchanges the `?code=`
  (PKCE) for a session. Do not change any code — wire up dashboards only.

## Phase 1 — Supabase: project + database

1. Go to supabase.com. Log in (use the browser's saved login; ask me if you
   need anything), then **New project**. Name: `ai-industry-alpha`, any
   region. For the database password, ASK ME to provide one — do not invent it.
2. Wait for provisioning (~2 min). Open **SQL Editor → New query**, paste the
   entire contents of `site/supabase/schema.sql` (from the raw GitHub URL
   above), and Run it.
3. Confirm the three tables exist: `newsletter_subscribers`, `profiles`,
   `subscriptions` (Table Editor).
4. **Project Settings → API**: note the **Project URL** and the **anon public**
   key — you will paste them into GitHub secrets in Phase 4. Also note the
   **service_role** key (needed for the newsletter sync secret).

## Phase 2 — Google Cloud: OAuth client

1. Go to console.cloud.google.com → **APIs & Services → Credentials**.
2. If it asks for an OAuth consent screen first: create one, type **External**,
   app name `AI Industry Alpha`. For the support email and developer contact,
   ASK ME which email to use. Add my Google email as a **test user** (ask me
   which email) — required while the app is in testing mode, or nobody
   (including me) can sign in.
3. **Create Credentials → OAuth client ID** → type **Web application**,
   name `AI Industry Alpha`.
4. Under **Authorized redirect URIs**, add exactly:
   `https://<project-ref>.supabase.co/auth/v1/callback`
   where `<project-ref>` is the subdomain of the Supabase Project URL from
   Phase 1 (e.g. `https://xyzcompany.supabase.co` → ref is `xyzcompany`).
5. Copy the **Client ID** and **Client secret** — paste them directly into
   Supabase in Phase 3, never into chat.

## Phase 3 — Supabase: enable Google provider + URLs

1. Supabase → **Authentication → Providers → Google → Enable**. Paste the
   Client ID and Client secret from Phase 2. Save.
2. **Authentication → Sign In / Up**: confirm the **Email** provider is ON
   (this powers the magic-link fallback).
3. **Authentication → URL Configuration**:
   - Site URL: `https://aialpha.news`
   - **Redirect URLs**: add `https://aialpha.news/#/auth/callback`
     (keep any existing entries).

## Phase 4 — GitHub: secrets + redeploy

1. github.com/janehwzn/ai-industry-alpha → **Settings → Secrets and
   variables → Actions → New repository secret**. Add these four
   (paste values directly from the dashboards, never print them):
   - `VITE_SUPABASE_URL` = Supabase Project URL (enables login/signup UI)
   - `VITE_SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_URL` = Supabase Project URL (newsletter sync job)
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (newsletter sync job)
2. **Actions → "Deploy site" → Run workflow** → wait until green.
   The Vite build embeds the `VITE_*` secrets, so this redeploy is what
   actually turns sign-in on.

## Phase 5 — Verify on the live site

Visit `https://aialpha.news` (hard-refresh to bypass cache) and check each
item — pass/fail plus a one-line note:

1. Header shows **Sign in** (no language toggle — the site is English-only).
2. Click **Sign in** → modal shows **Continue with Google** button with the
   Google "G" logo, an "or" divider, then the magic-link email form.
3. Click **Continue with Google** → Google's account chooser / consent screen
   appears (proves the OAuth client + Supabase provider are wired).
4. Complete the Google consent with the test-user email → you must land back
   on `https://aialpha.news/#/auth/callback` and end up signed in (header
   shows Account / sign-out instead of "Sign in"). If the consent screen says
   the app is unverified, that is expected in testing mode — proceed anyway.
5. Sign out, then sign in via magic link: enter an email, submit → the modal
   says to check the inbox. (You cannot read my inbox — ASK ME to confirm the
   email arrived and that clicking it signs me in.)
6. While signed in, open **Signal Ledger** — theses still show the paywall
   (expected: no Stripe subscription yet).

## Ground rules

- Account creation, payments, personal details: always ask me first.
- Never print keys/secrets/tokens in chat or in your report — confirm each
  secret was *set* without showing its value.
- Do not change code, prices, or copy — dashboards only. If something is
  broken, report exactly what and where instead of fixing it.
- End of each phase: report what was done and wait for my go-ahead.

## Known follow-ups (not your job today)

- Stripe (paid checkout) is still not connected — the Pricing page's Premium
  buttons show the waitlist form until Stripe keys are added.
- If I later add a custom auth domain or change Site URL, the Google
  redirect URI in Cloud Console must match Supabase's callback URL.
