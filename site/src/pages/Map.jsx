import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadData, timeAgo, excerpt } from '../lib/data.js'

const PALETTE = ['map-lime', 'map-coral', 'map-blue', 'map-violet', 'map-gold', 'map-mint']

export default function MapPage() {
  const [data, setData] = useState(null)
  const [active, setActive] = useState('all')

  useEffect(() => {
    loadData().then(setData).catch(() => setData({ headlines: [], theses: [], meta: {} }))
  }, [])

  const headlines = data?.headlines || []
  const categories = useMemo(() => {
    const fromMeta = data?.meta?.categories || []
    if (fromMeta.length) return fromMeta.map((category, i) => ({
      ...category,
      count: headlines.filter((item) => item.category_slug === category.slug).length,
      tone: PALETTE[i % PALETTE.length],
    }))
    const seen = new Map()
    headlines.forEach((item) => {
      const slug = item.category_slug || 'more-in-ai'
      if (!seen.has(slug)) seen.set(slug, { slug, name: item.category || 'More in AI', count: 0 })
      seen.get(slug).count += 1
    })
    return Array.from(seen.values()).map((category, i) => ({ ...category, tone: PALETTE[i % PALETTE.length] }))
  }, [data, headlines])

  const selected = categories.find((category) => category.slug === active)
  const stories = headlines.filter((item) => active === 'all' || item.category_slug === active)

  if (!data) return <div className="page"><div className="loading">Mapping the signals…</div></div>

  return (
    <div className="page intelligence-page">
      <div className="page-kicker"><span className="eyebrow-dot" /> FIELD GUIDE / 01</div>
      <section className="subpage-hero map-hero">
        <div>
          <div className="eyebrow">CONNECTING THE DOTS</div>
          <h1>The story is in<br /><em>the connections.</em></h1>
          <p>Explore the AI industry by topic. Each node opens the real stories behind that signal—no mystery scores, no invented links.</p>
        </div>
        <div className="map-hero-art" aria-hidden="true">
          <svg viewBox="0 0 300 220" role="presentation">
            <g className="network-lines">
              <line x1="150" y1="110" x2="52" y2="45" />
              <line x1="150" y1="110" x2="248" y2="42" />
              <line x1="150" y1="110" x2="257" y2="158" />
              <line x1="150" y1="110" x2="64" y2="183" />
              <line x1="150" y1="110" x2="150" y2="20" />
              <line x1="52" y1="45" x2="64" y2="183" />
              <line x1="248" y1="42" x2="257" y2="158" />
            </g>
            <circle className="network-hub" cx="150" cy="110" r="31" />
            <text className="network-hub-text" x="150" y="116" textAnchor="middle">α</text>
            <circle className="network-point lime" cx="52" cy="45" r="11" />
            <circle className="network-point coral" cx="248" cy="42" r="8" />
            <circle className="network-point blue" cx="257" cy="158" r="12" />
            <circle className="network-point violet" cx="64" cy="183" r="7" />
            <circle className="network-point gold" cx="150" cy="20" r="6" />
          </svg>
        </div>
      </section>

      <section className="map-explainer">
        <div><span className="eyebrow">HOW TO READ THIS MAP</span><p>Topics are grouped from the feed's existing categories. Select a node to inspect its stories; shared topics are a starting point for research, not proof of causation.</p></div>
        <div className="map-count"><strong>{categories.length.toString().padStart(2, '0')}</strong><span>TOPIC CLUSTERS</span></div>
        <div className="map-count"><strong>{headlines.length.toString().padStart(2, '0')}</strong><span>STORIES INDEXED</span></div>
      </section>

      <section className="topic-map-section">
        <div className="section-overline"><span>01</span><h2>Choose a signal cluster<span className="heading-period">.</span></h2></div>
        <div className="topic-map-grid">
          <button className={active === 'all' ? 'map-node map-node-all selected' : 'map-node map-node-all'} onClick={() => setActive('all')}>
            <span className="map-node-orb">α</span>
            <span className="map-node-copy"><b>All signals</b><small>The full landscape</small></span>
            <span className="map-node-count">{headlines.length}</span>
          </button>
          {categories.map((category) => (
            <button key={category.slug} className={active === category.slug ? `map-node ${category.tone} selected` : `map-node ${category.tone}`} onClick={() => setActive(category.slug)}>
              <span className="map-node-orb"><span aria-hidden="true">✳</span></span>
              <span className="map-node-copy"><b>{category.name}</b><small>{category.count ? 'Stories in this cluster' : 'No current stories'}</small></span>
              <span className="map-node-count">{category.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="map-stories-section">
        <div className="section-overline"><span>02</span><h2>{selected ? selected.name : 'The full signal stream'}<span className="heading-period">.</span></h2></div>
        <p className="map-results-note">{stories.length} {stories.length === 1 ? 'story' : 'stories'} · source-linked and ready to explore</p>
        <div className="map-story-list">
          {stories.slice(0, 12).map((item, index) => (
            <article className="map-story" key={item.id}>
              <span className="map-story-index">{String(index + 1).padStart(2, '0')}</span>
              <div className="map-story-body">
                <div className="meta editorial-meta"><span>{item.source}</span><span className="meta-dot">/</span><span>{timeAgo(item.pub)}</span></div>
                <h3><Link to={`/article/${item.id}`}>{item.title}</Link></h3>
                {item.summary && <p>{excerpt(item.summary, 190)}</p>}
              </div>
              <Link className="map-story-arrow" to={`/article/${item.id}`} aria-label={`Open ${item.title}`}>↗</Link>
            </article>
          ))}
          {stories.length === 0 && <p className="empty">No stories in this cluster yet. Choose another topic to explore.</p>}
        </div>
      </section>
      <div className="page-bottom-cta"><div><span className="eyebrow">READY FOR THE NEXT LAYER?</span><h2>Move from signals to a thesis.</h2></div><Link className="btn btn-dark" to="/intelligence">Explore Intelligence ↗</Link></div>
    </div>
  )
}
