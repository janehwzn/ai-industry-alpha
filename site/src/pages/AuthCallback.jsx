import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { useLang } from '../lib/lang.jsx'
import { useAuth } from '../lib/auth.jsx'

// Handles the auth redirect. Supabase appends ?code= (PKCE) — or
// ?token_hash= & type= for older flows — either to the URL query string
// (before the hash fragment) or to the query part of the hash route itself,
// e.g. #/auth/callback?code=... — so check both.
export default function AuthCallback() {
  const { t } = useLang()
  const { authModal } = useAuth()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!isSupabaseConfigured) {
        setFailed(true)
        return
      }
      try {
        const q = new URLSearchParams(window.location.search)
        const hashQuery = window.location.hash.split('?')[1]
        const hq = hashQuery ? new URLSearchParams(hashQuery) : null
        const code = q.get('code') || hq?.get('code')
        const tokenHash = q.get('token_hash') || hq?.get('token_hash')
        const type = q.get('type') || hq?.get('type')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type || 'magiclink',
          })
          if (error) throw error
        } else {
          throw new Error('missing-code')
        }
        if (cancelled) return
        // Clean the one-time params out of the URL, then land somewhere useful.
        window.history.replaceState(null, '', window.location.pathname + '#/')
        const next = authModal?.next || '/account'
        navigate(next, { replace: true })
      } catch {
        if (!cancelled) setFailed(true)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page">
      <div className="center">
        {failed ? (
          <>
            <p>{t('signin_failed')}</p>
            <p><Link to="/">{t('back_home')}</Link></p>
          </>
        ) : (
          <p>{t('finishing_signin')}</p>
        )}
      </div>
    </div>
  )
}
