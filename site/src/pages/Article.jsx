import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadData, timeAgo, excerpt } from '../lib/data.js'
import { useLang } from '../lib/lang.jsx'
import { useAuth } from '../lib/auth.jsx'
import Paywall from '../components/Paywall.jsx'
import { buildSignalGraph } from '../lib/signalGraph.js'

export default function Article() {
  const { id } = useParams()
  const { t } = useLang()
  const { isPremium } = useAuth()
  const [data, setData] = useState(null)
  const signalGraph = useMemo(() => buildSignalGraph(data?.headlines || []), [data])

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
  const connectedEntities = signalGraph.forStory(item.id)
  const relatedSignals = Array.from(new Map(connectedEntities.flatMap((entity) => signalGraph.relatedStories(entity.id, 4)).filter((story) => story.id !== item.id).map((story) => [story.id, story])).values()).slice(0, 3)
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
        {connectedEntities.length > 0 && (
          <section className="article-signal-connections">
            <div className="eyebrow">IN THE WIDER SIGNAL MAP</div>
            <h2>Names behind this story<span className="heading-period">.</span></h2>
            <p>These entities were recognized in this story's title or summary. Explore their wider coverage and inspect the source trails.</p>
            <div className="article-entity-chips">{connectedEntities.map((entity) => <Link key={entity.id} to={`/map?entity=${entity.id}&story=${item.id}`}>{entity.name} <span aria-hidden="true">↗</span></Link>)}</div>
            {relatedSignals.length > 0 && <div className="article-related-signals"><span className="eyebrow">OTHER COVERAGE ACROSS THESE ENTITIES</span>{relatedSignals.map((story) => <Link key={story.id} to={`/article/${story.id}`}><span>{story.source} / {timeAgo(story.pub)}</span><b>{story.title}</b></Link>)}</div>}
          </section>
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
