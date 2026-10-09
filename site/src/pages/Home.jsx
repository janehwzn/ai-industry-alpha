import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadData, timeAgo, excerpt } from '../lib/data.js'
import { useLang } from '../lib/lang.jsx'
import { useAuth } from '../lib/auth.jsx'
import NewsletterBox from '../components/NewsletterBox.jsx'
import { SITE, PREMIUM_FEATURES } from '../config.js'

function HeadlineRow({ item }) {
  const { t } = useLang()
  return (
    <Link className="headline-row" to={`/article/${item.id}`}>
      <div className="meta" style={{ marginBottom: '0.25rem' }}>
        <span className="source">{item.source}</span>
        <span>·</span>
        <span>{timeAgo(item.pub)}</span>
        {item.premium ? (
          <span className="badge badge-premium">🔒 {t('members_only')}</span>
        ) : (
          <span className="badge badge-free">{t('free')}</span>
        )}
      </div>
      <h2>{item.title}</h2>
      {item.summary && <p className="summary">{excerpt(item.summary, 220)}</p>}
    </Link>
  )
}

export default function Home() {
  const { t } = useLang()
  const { isPremium } = useAuth()
  const [data, setData] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadData().then(setData).catch(() => setData({ headlines: [], theses: [], meta: {} }))
  }, [])

  if (!data) return <div className="page"><div className="loading">…</div></div>
  const { headlines = [], theses = [], meta = {} } = data
  const q = query.trim().toLowerCase()
  const filtered = q
    ? headlines.filter((h) =>
        `${h.title} ${h.summary} ${h.source}`.toLowerCase().includes(q)
      )
    : headlines
  const [top, ...rest] = filtered
  const mostRead = headlines.slice(0, 5)

  return (
    <div className="page">
      <div className="hero-strip">
        <h1>
          Know which <em>AI shifts</em> matter
        </h1>
        <p>{SITE.tagline}</p>
        <div className="row">
          <Link className="btn btn-amber" to="/pricing">{t('go_premium')}</Link>
          <Link className="btn btn-ghost" to="/theses" style={{ borderColor: '#3a4a6b', background: 'transparent', color: '#fff' }}>
            🔒 {t('nav_theses')}
          </Link>
        </div>
      </div>

      <div className="grid">
        <div>
          <div className="searchbar">
            <input
              placeholder={t('search_placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {!q && top && (
            <>
              <div className="section-head">{t('top_story')}</div>
              <Link className="top-story" to={`/article/${top.id}`}>
                <span className="kicker">{top.source}</span>
                <h1>{top.title}</h1>
                <p>{excerpt(top.summary, 280)}</p>
                <div className="meta" style={{ marginTop: '0.75rem' }}>
                  <span>{timeAgo(top.pub)}</span>
                </div>
              </Link>
            </>
          )}

          <div className="section-head">
            {q ? t('search_placeholder') : t('latest_news')}
            <span className="rule-note">{filtered.length} stories</span>
          </div>
          {(q ? filtered : rest).length === 0 && <p className="empty">{t('no_results')}</p>}
          {(q ? filtered : rest).map((h) => (
            <HeadlineRow key={h.id} item={h} />
          ))}
        </div>

        <aside>
          <NewsletterBox source="sidebar" />
          {!isPremium && (
            <div className="side-block side-dark">
              <h3>🔒 AI Industry Alpha {t('premium')}</h3>
              <p className="small">{t('unlock_sub')}</p>
              <ul style={{ fontSize: 13.5, paddingLeft: '1.1rem', margin: '0 0 1rem', lineHeight: 1.7, color: '#c9d2e3' }}>
                {PREMIUM_FEATURES.slice(0, 3).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link className="btn btn-amber btn-sm" to="/pricing" style={{ width: '100%' }}>
                {t('go_premium')}
              </Link>
            </div>
          )}
          <div className="side-block">
            <h3>{t('most_read')}</h3>
            <ol className="most-read">
              {mostRead.map((h) => (
                <li key={h.id}>
                  <Link to={`/article/${h.id}`}>{h.title}</Link>
                </li>
              ))}
            </ol>
          </div>
          {meta.sources && meta.sources.length > 0 && (
            <div className="side-block">
              <h3>{t('topics')}</h3>
              <div className="topic-cloud">
                {meta.sources.slice(0, 12).map((s) => (
                  <span className="topic-chip" key={s}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
