import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadData, excerpt } from '../lib/data.js'
import { useLang } from '../lib/lang.jsx'

export default function Theses() {
  const { t } = useLang()
  const [data, setData] = useState(null)

  useEffect(() => {
    loadData().then(setData).catch(() => setData({ theses: [] }))
  }, [])

  if (!data) return <div className="page"><div className="loading">…</div></div>
  const theses = data.theses || []

  return (
    <div className="page">
      <div className="section-head">
        {t('nav_theses')}
        <span className="rule-note">{theses.length} theses</span>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.65, maxWidth: 720, margin: '0 0 1.5rem' }}>
        {t('unlock_sub')}
      </p>
      {theses.map((th) => (
        <Link className="thesis-card" key={th.id} to={`/thesis/${th.id}`}>
          <span className="angle-tag">{th.angle || 'Thesis'}</span>
          <h2>{th.thesis}</h2>
          <p>{excerpt(th.why_now, 220)}</p>
          <div className="meta" style={{ marginTop: '0.6rem' }}>
            {th.sample ? (
              <span className="badge badge-free">{t('free_sample')}</span>
            ) : (
              <span className="badge badge-premium">🔒 {t('members_only')}</span>
            )}
            {th.week && <span>{t('week_of')} {th.week}</span>}
          </div>
        </Link>
      ))}
      {theses.length === 0 && <p className="empty">{t('no_results')}</p>}
    </div>
  )
}
