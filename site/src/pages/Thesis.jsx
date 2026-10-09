import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadData, excerpt } from '../lib/data.js'
import { useLang } from '../lib/lang.jsx'
import { useAuth } from '../lib/auth.jsx'
import Paywall from '../components/Paywall.jsx'

export default function Thesis() {
  const { id } = useParams()
  const { t } = useLang()
  const { isPremium } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    loadData().then(setData).catch(() => setData({ theses: [] }))
  }, [])

  if (!data) return <div className="page"><div className="loading">…</div></div>
  const th = (data.theses || []).find((x) => x.id === id)
  if (!th) {
    return (
      <div className="page">
        <p className="empty">{t('no_results')}</p>
        <p style={{ textAlign: 'center' }}><Link to="/theses">{t('back_home')}</Link></p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="article">
        <Link to="/theses" style={{ fontSize: 13.5, color: 'var(--muted)', textDecoration: 'none' }}>
          ← {t('nav_theses')}
        </Link>
        <div className="meta" style={{ marginTop: '1rem' }}>
          <span className="angle-tag">{th.angle || 'Thesis'}</span>
          {th.week && <span>{t('week_of')} {th.week}</span>}
          <span className="badge badge-premium">🔒 {t('members_only')}</span>
        </div>
        <h1>{th.thesis}</h1>
        {!isPremium ? (
          <Paywall
            blurredPreview={
              <>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
                  {t('why_now')}
                </h4>
                <p className="lede">{excerpt(th.why_now, 500)}</p>
              </>
            }
          />
        ) : (
          <div className="article-body">
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
              {t('why_now')}
            </h4>
            <p className="lede">{th.why_now}</p>
            {th.evidence && th.evidence.length > 0 && (
              <>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginTop: '1.5rem' }}>
                  {t('evidence')}
                </h4>
                <ul className="evidence-list">
                  {th.evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </>
            )}
            {th.angle && (
              <div className="angle-box">
                <h4>{t('startup_angle')}</h4>
                <p>{th.angle}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
