import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadData, timeAgo, excerpt } from '../lib/data.js'
import { useLang } from '../lib/lang.jsx'
import { useAuth } from '../lib/auth.jsx'
import Paywall from '../components/Paywall.jsx'

export default function Article() {
  const { id } = useParams()
  const { t } = useLang()
  const { isPremium } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    loadData().then(setData).catch(() => setData({ headlines: [] }))
  }, [])

  if (!data) return <div className="page"><div className="loading">…</div></div>
  const item = (data.headlines || []).find((h) => h.id === id)
  if (!item) {
    return (
      <div className="page">
        <p className="empty">{t('no_results')}</p>
        <p style={{ textAlign: 'center' }}><Link to="/">{t('back_home')}</Link></p>
      </div>
    )
  }
  const gated = item.premium && !isPremium
  const related = (data.headlines || [])
    .filter((h) => h.id !== item.id && h.source === item.source)
    .slice(0, 3)

  return (
    <div className="page">
      <div className="article">
        <Link to="/" style={{ fontSize: 13.5, color: 'var(--muted)', textDecoration: 'none' }}>
          ← {t('nav_latest')}
        </Link>
        <div className="meta" style={{ marginTop: '1rem' }}>
          <span className="source">{item.source}</span>
          <span>·</span>
          <span>{timeAgo(item.pub)}</span>
          {item.premium && <span className="badge badge-premium">🔒 {t('members_only')}</span>}
        </div>
        <h1>{item.title}</h1>
        <div className="article-body">
          <p className="lede">{item.summary}</p>
        </div>
        {gated ? (
          <Paywall
            blurredPreview={
              <p className="lede">{excerpt(item.summary, 400)}</p>
            }
          />
        ) : (
          <div className="source-btn">
            <a className="btn" href={item.link} target="_blank" rel="noreferrer">
              {t('read_full_story')} →
            </a>
          </div>
        )}
        {related.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <div className="section-head">{t('related')}</div>
            {related.map((r) => (
              <Link className="headline-row" key={r.id} to={`/article/${r.id}`}>
                <h2 style={{ fontSize: 16 }}>{r.title}</h2>
                <div className="meta"><span>{timeAgo(r.pub)}</span></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
