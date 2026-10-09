-- AI Industry Alpha backend schema.
-- Run once in Supabase Dashboard > SQL Editor (or `supabase db push`).

-- ------------------------------------------------------------------
-- 1. Free newsletter signups (written by the site's signup forms)
-- ------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "anon-insert-subscribers" on public.newsletter_subscribers;
create policy "anon-insert-subscribers"
  on public.newsletter_subscribers
  for insert to anon
  with check (true);
-- NOTE: service_role bypasses RLS, so the sync script
-- (site/scripts/sync-subscribers.py) can read all rows.

-- ------------------------------------------------------------------
-- 2. Auth profiles (one row per login, auto-created on signup)
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own-profile" on public.profiles;
create policy "own-profile"
  on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------
-- 3. Paid subscriptions (written by the stripe-webhook edge function)
-- ------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null,
  tier text not null default 'premium',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "own-subscription" on public.subscriptions;
create policy "own-subscription"
  on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

-- ------------------------------------------------------------------
-- 4. Advertising inquiries (written by the site's advertising form)
-- ------------------------------------------------------------------
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
-- NOTE: service_role bypasses RLS, so the notify workflow
-- (.github/workflows/inquiries.yml) can read new rows.
