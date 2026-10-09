import { createClient } from '@supabase/supabase-js'

// Public fallback values: the anon key is safe to commit (it's protected by
// Row Level Security and is meant to ship in client bundles). Env vars still
// win when set, e.g. for local overrides. NEVER put the service_role key here.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://hznooqfjfzomvbspvuba.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bm9vcWZqZnpvbXZic3B2dWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MjAzOTUsImV4cCI6MjEwNzA5NjM5NX0.MAL99jbqYMoHS2vE3bflnuJ9nrlofB91oMao52oYYag'

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// PKCE flow: magic-link emails carry a `code` query param that we exchange
// manually in the /auth/callback page. detectSessionInUrl is off because the
// app uses hash routing, which would otherwise swallow Supabase's fragment.
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
