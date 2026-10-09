import React, { useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { useLang } from '../lib/lang.jsx'
import { isSupabaseConfigured } from '../lib/supabaseClient.js'
import NewsletterBox from './NewsletterBox.jsx'

export default function AuthModal() {
  const { authModal, setAuthModal, signInWithEmail } = useAuth()
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!authModal) return null

  const close = () => {
    setAuthModal(null)
    setSent(false)
    setError('')
    setEmail('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const value = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('Please enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      await signInWithEmail(value)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="Close">×</button>
        <h2>{t('signin_title')}</h2>
        <p className="sub">{t('signin_sub')}</p>
        {!isSupabaseConfigured ? (
          <>
            <p className="sub">{t('auth_not_ready')}</p>
            <NewsletterBox source="auth-modal" />
          </>
        ) : sent ? (
          <p className="form-ok">{t('check_inbox')}</p>
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
            <button className="btn btn-amber" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? '…' : t('send_link')}
            </button>
            {error && <p className="form-err">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
