import React, { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { useLang } from '../lib/lang.jsx'
import { SITE } from '../config.js'

// GeekWire-style subscribe popup: appears once per visit after a short
// delay, dismissed state persists for 7 days, never shows again after signup.
const DELAY_MS = 12000
const DISMISS_DAYS = 7
const STORE_KEY = 'aia-popup'

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
  } catch {
    return {}
  }
}

export default function SubscribePopup() {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const s = readStore()
    if (s.subscribed) return undefined
    if (s.dismissedAt && Date.now() - s.dismissedAt < DISMISS_DAYS * 864e5) {
      return undefined
    }
    const timer = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const persist = (patch) => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ ...readStore(), ...patch }))
    } catch {}
  }

  const dismiss = () => {
    persist({ dismissedAt: Date.now() })
    setOpen(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const value = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!isSupabaseConfigured) {
      setError(t('newsletter_not_ready'))
      return
    }
    try {
      const { error: dbError } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: value, source: 'popup' })
      if (dbError && !String(dbError.message).toLowerCase().includes('duplicate')) {
        throw dbError
      }
      persist({ subscribed: true })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  if (!open) return null

  return (
    <div className="popup-overlay" onClick={dismiss}>
      <div className="popup" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <span className="logo-mark" style={{ width: 46, height: 46, fontSize: 28 }}>α</span>
        <h2>{t('popup_title')}</h2>
        <p className="sub">{t('popup_sub')}</p>
        {done ? (
          <p className="form-ok">{t('subscribed_msg')}</p>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <input
                type="email"
                placeholder={t('email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn btn-amber" type="submit" style={{ width: '100%' }}>
              {t('subscribe_btn')}
            </button>
            {error && <p className="form-err">{error}</p>}
            {!isSupabaseConfigured && !error && (
              <p className="small" style={{ marginTop: '0.6rem', fontSize: 13, color: 'var(--muted)' }}>
                {t('newsletter_not_ready')}{' '}
                <a href={`${SITE.repoUrl}/issues/new?title=Subscribe`} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </p>
            )}
          </form>
        )}
        <button className="popup-dismiss" onClick={dismiss}>
          {t('no_thanks')}
        </button>
      </div>
    </div>
  )
}
