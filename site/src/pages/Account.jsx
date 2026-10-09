import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/lang.jsx'
import { useAuth } from '../lib/auth.jsx'
import { openBillingPortal } from '../lib/stripe.js'
import { PLANS } from '../config.js'

export default function Account() {
  const { t } = useLang()
  const { user, subscription, isPremium, loading, signOut, setAuthModal } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <div className="page"><div className="loading">…</div></div>

  if (!user) {
    return (
      <div className="page">
        <div className="account-card">
          <h2>{t('account')}</h2>
          <p style={{ color: 'var(--muted)' }}>{t('account_signin_needed')}</p>
          <button className="btn btn-amber" onClick={() => setAuthModal({ next: '/account' })}>
            {t('sign_in')}
          </button>
        </div>
      </div>
    )
  }

  const manage = async () => {
    setError('')
    setBusy(true)
    try {
      await openBillingPortal()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="account-card">
        <h2>
          {t('welcome_back')}
        </h2>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>{user.email}</p>
        <div style={{ marginTop: '1rem' }}>
          <div className="account-row">
            <span className="label">{t('current_plan')}</span>
            <span>
              {isPremium ? (
                <span className="badge badge-premium">🔒 {t('premium')}</span>
              ) : (
                <span className="badge badge-free">{t('free')}</span>
              )}
            </span>
          </div>
          {isPremium && subscription?.current_period_end && (
            <div className="account-row">
              <span className="label">{t('renews')}</span>
              <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: '1rem' }}>
          {isPremium ? t('premium_plan_note') : t('free_plan_note')}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {isPremium ? (
            <button className="btn" onClick={manage} disabled={busy}>
              {busy ? '…' : t('manage_billing')}
            </button>
          ) : (
            <Link className="btn btn-amber" to="/pricing">{t('go_premium')}</Link>
          )}
          <button className="btn btn-ghost" onClick={signOut}>{t('sign_out')}</button>
        </div>
        {error && <p className="form-err">{error}</p>}
      </div>
    </div>
  )
}
