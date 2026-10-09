// Fetch the full body of a locked thesis from the thesis-content Edge
// Function. Only verified premium subscribers get a response; everyone
// else receives a 403. Free samples are already complete in theses.json and
// never need this call.
import { supabase, SUPABASE_URL } from './supabaseClient.js'

export async function fetchFullThesis(id) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('not-signed-in')
  const res = await fetch(
    `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/thesis-content?id=${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: session.access_token,
      },
    },
  )
  const payload = await res.json().catch(() => ({}))
  if (!res.ok || payload.error) throw new Error(payload.error || 'request-failed')
  return payload.thesis
}
