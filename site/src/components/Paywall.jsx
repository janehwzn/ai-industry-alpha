import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useLang } from '../lib/lang.jsx'

export default function Paywall({ blurredPreview }) {
  const { setAuthModal, user } = useAuth()
  const { t } = useLang()
  return (
    <div className="paywall">
      {blurredPreview && <div className="paywall-preview blurred">{blurredPreview}</div>}
      <div className="paywall-cta">
        <h3>🔒 {t('unlock_title')}</h3>
        <p>{t('unlock_sub')}</p>
        <div className="row">
          <Link className="btn btn-amber" to="/pricing">{t('see_plans')}</Link>
          {!user && (
            <button className="btn btn-ghost" onClick={() => setAuthModal({ next: '/pricing' })}>
              {t('sign_in')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
