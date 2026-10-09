import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadData, excerpt } from '../lib/data.js'
import { useLang } from '../lib/lang.jsx'

// Signal Ledger sections: the angle-based reading of the news. Must match
// LEDGER_SECTIONS in site/scripts/build-data.py and the synthesis prompt.
const SECTIONS = [
  { name: 'Money Moves', slug: 'money-moves', emoji: '💰' },
  { name: 'People Moves', slug: 'people-moves', emoji: '🧑‍💼' },
  { name: 'AI Infra', slug: 'ai-infra', emoji: '🖥️' },
  { name: 'Models', slug: 'models', emoji: '🤖' },
  { name: 'Energy & Power', slug: 'energy-power', emoji: '⚡' },
  { name: 'Cost Curves', slug: 'cost-curves', emoji: '📉' },
]

function scrollToSection(slug) {
  const el = document.getElementById(`ledger-${slug}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function ThesisCard({ th }) {
  const { t } = useLang()
  return (
    <Link className="thesis-card" to={`/thesis/${th.id}`}>
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
  )
}

export default function Theses() {
  const { t } = useLang()
  const [data, setData] = useState(null)

  useEffect(() => {
    loadData().then(setData).catch(() => setData({ theses: [] }))
  }, [])

  if (!data) return <div className="page"><div className="loading">…</div></div>
  const theses = data.theses || []
  const bySection = {}
  theses.forEach((th) => {
    const s = th.section_slug || 'ai-infra'
    ;(bySection[s] = bySection[s] || []).push(th)
  })
  const activeSections = SECTIONS.filter((s) => (bySection[s.slug] || []).length > 0)

  return (
    <div className="page">
      <div className="section-head">
        {t('nav_theses')}
        <span className="rule-note">{theses.length} theses</span>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.65, maxWidth: 720, margin: '0 0 1rem' }}>
        {t('ledger_intro')}
      </p>

      <div className="cat-nav" style={{ marginBottom: '0.5rem' }}>
        {activeSections.map((s) => (
          <button key={s.slug} className="cat-chip" onClick={() => scrollToSection(s.slug)}>
            {s.emoji} {s.name}
          </button>
        ))}
      </div>

      {activeSections.map((s) => (
        <section key={s.slug} id={`ledger-${s.slug}`} className="cat-section">
          <div className="cat-head">
            <h2>{s.emoji} {s.name}</h2>
            <span className="rule-note">{bySection[s.slug].length} {bySection[s.slug].length === 1 ? 'thesis' : 'theses'}</span>
          </div>
          {(bySection[s.slug] || []).map((th) => (
            <ThesisCard key={th.id} th={th} />
          ))}
        </section>
      ))}
      {theses.length === 0 && <p className="empty">{t('no_results')}</p>}
    </div>
  )
}
