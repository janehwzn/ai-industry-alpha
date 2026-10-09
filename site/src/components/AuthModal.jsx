import React, { useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { useLang } from '../lib/lang.jsx'
import { isSupabaseConfigured } from '../lib/supabaseClient.js'
import NewsletterBox from './NewsletterBox.jsx'

export default function AuthModal() {
  const { authModal, setAuthModal, signInWithEmail, signInWithGoogle } = useAuth()
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

  const google = async () => {
    setError('')
    setBusy(true)
    try {
      await signInWithGoogle()
      // On success the browser redirects to Google; the modal unmounts on return.
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setBusy(false)
    }
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
          <>
            <button className="btn btn-google" onClick={google} disabled={busy} style={{ width: '100%' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.42-3.42A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
              </svg>
              {t('continue_with_google')}
            </button>
            <div className="divider"><span>{t('or')}</span></div>
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
          </>
        )}
      </div>
    </div>
  )
}
