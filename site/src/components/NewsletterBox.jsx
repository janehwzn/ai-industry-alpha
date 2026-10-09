import React, { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { useLang } from '../lib/lang.jsx'
import { SITE } from '../config.js'

export default function NewsletterBox({ source = 'sidebar', dark = false }) {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const value = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!isSupabaseConfigured) {
      setError(t('auth_not_ready'))
      return
    }
    setBusy(true)
    try {
      const { error: dbError } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: value, source })
      if (dbError && !String(dbError.message).toLowerCase().includes('duplicate')) {
        throw dbError
      }
      setDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`side-block ${dark ? 'side-dark' : ''}`}>
      <h3>✉️ {t('free_newsletter')}</h3>
      <p className="small"><strong>{t('newsletter_title')}</strong><br />{t('newsletter_sub')}</p>
      {done ? (
        <p className="form-ok">{t('subscribed_msg')}</p>
      ) : (
        <form className="mini-form" onSubmit={submit}>
          <input
            type="email"
            placeholder={t('email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
          />
          <button className="btn btn-amber btn-sm" type="submit" disabled={busy}>
            {busy ? '…' : t('subscribe_btn')}
          </button>
        </form>
      )}
      {error && <p className="form-err">{error}</p>}
      {!isSupabaseConfigured && !error && (
        <p className="small" style={{ marginTop: '0.6rem' }}>
          {t('auth_not_ready')}{' '}
          <a href={`${SITE.repoUrl}/issues/new?title=Subscribe`} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </p>
      )}
    </div>
  )
}
