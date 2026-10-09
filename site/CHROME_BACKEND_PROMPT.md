# Claude-in-Chrome prompt: wire up the advertising backend + email forwarding

Copy everything below the line into your Claude Chrome agent. It finishes
the three dashboard tasks I can't do from here: creating the Supabase table
for the advertising form, adding a GitHub secret for the notifier, and
setting up email forwarding for hello@aialpha.news.

---

You are helping me finish the backend wiring for my website's advertising
inquiry form. Work in three phases, and report the result of each phase
before moving to the next. Ask me before any account creation, payment, or
entering personal details — never invent them. Never print API keys,
secrets, or tokens in chat; copy them directly from one field to another.

## Context

- Live site: `https://aialpha.news` (GitHub repo `janehwzn/ai-industry-alpha`,
  branch `main`). The `/advertising` page has an inquiry form (name, email,
  company, message) that writes to the Supabase table
  `public.advertising_inquiries` — but the table doesn't exist yet, so
  submissions currently fail. A daily GitHub workflow
  (`.github/workflows/inquiries.yml`) emails me about new inquiries; it
  needs the Supabase service_role key as a repo secret.
- Supabase project: `ai-industry-alpha`
  (Project URL `https://hznooqfjfzomvbspvuba.supabase.co`).
- The contact email shown on the site, `hello@aialpha.news`, has no mailbox
  behind it. My domain's DNS is on Porkbun, which offers free email
  forwarding — point it at my Gmail.
- Do not change any code — dashboards only.

## Phase 1 — Supabase: create the advertising_inquiries table

1. Supabase dashboard → project `ai-industry-alpha` → **SQL Editor → New
   query**. Paste and run exactly this:

```sql
create table if not exists public.advertising_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.advertising_inquiries enable row level security;

drop policy if exists "anon-insert-inquiries" on public.advertising_inquiries;
create policy "anon-insert-inquiries"
  on public.advertising_inquiries
  for insert to anon
  with check (true);
```

2. Confirm it reports success (no red errors). Then **Table Editor →
   advertising_inquiries** and confirm the table exists with those columns.
   If the table already exists from a previous run, that's fine — this SQL
   is idempotent, just confirm the columns.

## Phase 2 — GitHub: add the service_role secret

1. github.com/janehwzn/ai-industry-alpha → **Settings → Secrets and
   variables → Actions → New repository secret**.
2. Name: `SUPABASE_SERVICE_ROLE_KEY`.
3. Value: copy it from Supabase dashboard → project `ai-industry-alpha` →
   **Project Settings → API → `service_role` key** (the secret one, NOT the
   anon key). Paste it directly into the GitHub secret field — never print
   it in chat.
4. Confirm the secret was saved (name only, never the value).

## Phase 3 — Porkbun: forward hello@aialpha.news to my Gmail

1. Log in at porkbun.com (use the browser's saved login; ask me if you
   need anything).
2. **Domain Management → aialpha.news → Email Forwarding** (Porkbun
   includes this free with the domain).
3. Add a forward: `hello@aialpha.news` → `janehwzn@gmail.com`.
4. Confirm the forward is listed as active.
5. Note for me: the first forwarded test email may land in Gmail's spam
   folder (normal for new forwards) — I should check spam, and mark it
   "not spam" once.

## Ground rules

- Account creation, payments, personal details: always ask me first.
- Never print keys, secrets, or tokens in chat or in your report — confirm
  each was *set* without showing its value.
- Do not change code — dashboards only. If something is broken, report
  exactly what and where instead of fixing it.
- End of each phase: report what was done and wait for my go-ahead.

## Known follow-ups (not your job today)

- Once the table exists, the `/advertising` form works end-to-end and the
  daily notifier emails new inquiries to me every morning.
- If I later want a real mailbox (send-as hello@aialpha.news) instead of
  forwarding, that's Google Workspace or Zoho — a separate decision.
