import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadData } from '../lib/data.js'
import { useLang } from '../lib/lang.jsx'
import { HeadlineRow } from './Home.jsx'

export default function Category() {
  const { slug } = useParams()
  const { t } = useLang()
  const [data, setData] = useState(null)

  useEffect(() => {
    loadData().then(setData).catch(() => setData({ headlines: [], meta: {} }))
  }, [])

  if (!data) return <div className="page"><div className="loading">…</div></div>
  const { headlines = [], meta = {} } = data
  const cat = (meta.categories || []).find((c) => c.slug === slug)
  const items = headlines.filter((h) => h.category_slug === slug)

  return (
    <div className="page">
      <div className="list-narrow">
        <Link to="/" className="back-link">← {t('back_home')}</Link>
        <div className="section-head">
          <span>{cat ? cat.name : slug}</span>
          <span className="rule-note">{items.length} stories</span>
        </div>
        {items.length === 0 && <p className="empty">{t('no_results')}</p>}
        {items.map((h) => (
          <HeadlineRow key={h.id} item={h} />
        ))}
      </div>
    </div>
  )
}
