import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lib/lang.jsx'
import { useAuth } from '../lib/auth.jsx'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { PLANS, FREE_FEATURES, PREMIUM_FEATURES, stripeConfigured, SITE } from '../config.js'
import { startCheckout } from '../lib/stripe.js'
import NewsletterBox from '../components/NewsletterBox.jsx'

export default function Pricing() {
  const { t } = useLang()
  const { user, isPremium, setAuthModal } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [waitEmail, setWaitEmail] = useState('')
  const [waitDone, setWaitDone] = useState(false)

  const subscribe = async (planId) => {
    setError('')
    if (!user) {
      setAuthModal({ next: '/pricing' })
      return
    }
    setBusy(planId)
    try {
      await startCheckout(planId)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setBusy(null)
    }
  }

  const joinWaitlist = async (e) => {
    e.preventDefault()
    setError('')
    const value = waitEmail.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('Please enter a valid email address.')
      return
    }
    try {
      const { error: dbError } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: value, source: 'premium-waitlist' })
      if (dbError && !String(dbError.message).toLowerCase().includes('duplicate')) throw dbError
      setWaitDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="page">
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, margin: '0.5rem 0' }}>{t('go_premium')}</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.6 }}>{t('unlock_sub')}</p>
      </div>

      <div className="plans">
        <div className="plan">
          <h3>{t('free')}</h3>
          <div className="price">$0<span>{t('per_month')}</span></div>
          <ul>
            {FREE_FEATURES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <NewsletterBox source="pricing-free" />
        </div>

        <div className="plan featured">
          <span className="plan-flag">{t('premium')}</span>
          <h3>AI Industry Alpha {t('premium')}</h3>
          <div className="price">
            ${PLANS.monthly.price}
            <span>{t('per_month')}</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '0.25rem 0 0' }}>
            ${PLANS.annual.price}{t('per_year')} — save ${(PLANS.monthly.price * 12 - PLANS.annual.price).toFixed(0)}
          </p>
          <ul>
            {PREMIUM_FEATURES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {isPremium ? (
            <button className="btn btn-ghost" onClick={() => navigate('/account')}>
              {t('account')}
            </button>
          ) : stripeConfigured && isSupabaseConfigured ? (
            <>
              <button
                className="btn btn-amber"
                disabled={busy !== null}
                onClick={() => subscribe('monthly')}
                style={{ marginBottom: '0.6rem' }}
              >
                {busy === 'monthly' ? '…' : `${t('go_premium')} — $${PLANS.monthly.price}${t('per_month')}`}
              </button>
              <button className="btn btn-ghost" disabled={busy !== null} onClick={() => subscribe('annual')}>
                {busy === 'annual' ? '…' : `$${PLANS.annual.price}${t('per_year')}`}
              </button>
              {error && <p className="form-err">{error}</p>}
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{t('premium_waitlist')}</p>
              {waitDone ? (
                <p className="form-ok">{t('waitlist_done')}</p>
              ) : (
                <form className="mini-form" onSubmit={joinWaitlist}>
                  <input
                    type="email"
                    placeholder={t('email_placeholder')}
                    value={waitEmail}
                    onChange={(e) => setWaitEmail(e.target.value)}
                  />
                  <button className="btn btn-amber btn-sm" type="submit">{t('join_waitlist')}</button>
                </form>
              )}
              {error && <p className="form-err">{error}</p>}
            </>
          )}
        </div>
      </div>
      <p className="plan-note">
        {t('unlock_sub')} · {SITE.contactEmail}
      </p>
    </div>
  )
}
