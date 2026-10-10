import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadData, timeAgo, excerpt } from '../lib/data.js'
import { useLang } from '../lib/lang.jsx'
import { useAuth } from '../lib/auth.jsx'
import NewsletterBox from '../components/NewsletterBox.jsx'
import { SITE, PREMIUM_FEATURES } from '../config.js'

export function HeadlineRow({ item }) {
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

function StoryMeta({ item }) {
  return (
    <div className="meta editorial-meta">
      <span>{item.category || item.source}</span>
      <span className="meta-dot">/</span>
      <span>{timeAgo(item.pub)}</span>
    </div>
  )
}

function StoryCard({ item, featured = false }) {
  return (
    <Link className={featured ? 'story-card story-card-featured' : 'story-card'} to={`/article/${item.id}`}>
      <StoryMeta item={item} />
      <h2>{item.title}</h2>
      {item.summary && <p>{excerpt(item.summary, featured ? 240 : 150)}</p>}
      <span className="story-card-link">Read the signal <span aria-hidden="true">↗</span></span>
    </Link>
  )
}

export default function Home() {
  const { t } = useLang()
  const { isPremium } = useAuth()
  const [data, setData] = useState(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    loadData().then(setData).catch(() => setData({ headlines: [], theses: [], meta: {} }))
  }, [])

  const headlines = data?.headlines || []
  const categories = data?.meta?.categories || []
  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => headlines.filter((item) => {
    const matchesQuery = !q || `${item.title} ${item.summary || ''} ${item.source || ''} ${item.category || ''}`.toLowerCase().includes(q)
    const matchesCategory = activeCategory === 'all' || item.category_slug === activeCategory
    return matchesQuery && matchesCategory
  }), [headlines, q, activeCategory])
  const lead = filtered[0]
  const remaining = filtered.slice(1)

  if (!data) return <div className="page"><div className="loading">Gathering the signals…</div></div>

  return (
    <div className="page editorial-page">
      <section className="editorial-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Independent AI industry intelligence</div>
          <h1>Follow the signals.<br /><em>Find the next wave.</em></h1>
          <p>Less AI noise. More context on the companies, capital, infrastructure, and ideas reshaping the industry.</p>
          <div className="hero-actions">
            <Link className="btn btn-lime" to="/map">Connect the dots <span aria-hidden="true">↗</span></Link>
            <a className="text-link" href="#latest-signals">Explore the feed <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <span className="orbit-node node-a" />
          <span className="orbit-node node-b" />
          <span className="orbit-node node-c" />
          <span className="orbit-node node-d" />
          <div className="orbit-core"><span>α</span><small>THE SIGNAL</small></div>
          <div className="hero-art-note">Patterns over headlines<br /><b>Context over hype.</b></div>
        </div>
        <div className="hero-bottomline">
          <span>THE AI INDUSTRY, READ BETWEEN THE LINES</span>
          <span>{headlines.length.toLocaleString()} signals in the feed <span aria-hidden="true">↘</span></span>
        </div>
      </section>

      <section className="editorial-navline">
        <div><span className="live-dot" /> FIELD NOTES <span className="navline-muted">/ WHAT'S MOVING NOW</span></div>
        <div className="editorial-navlinks">
          <Link to="/map">Connecting the dots ↗</Link>
          <Link to="/intelligence">Intelligence ↗</Link>
        </div>
      </section>

      <section className="feed-toolbar" id="latest-signals">
        <div>
          <div className="eyebrow">01 / THE FEED</div>
          <h2>Latest signals<span className="heading-period">.</span></h2>
          <p>Stories worth tracking, with the source attached.</p>
        </div>
        <label className="feed-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search AI industry stories"
            placeholder="Search companies, topics, signals…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
        </label>
      </section>

      <div className="topic-filter" aria-label="Filter stories by topic">
        <button className={activeCategory === 'all' ? 'topic-filter-chip active' : 'topic-filter-chip'} onClick={() => setActiveCategory('all')}>All signals</button>
        {categories.map((category) => (
          <button key={category.slug} className={activeCategory === category.slug ? 'topic-filter-chip active' : 'topic-filter-chip'} onClick={() => setActiveCategory(category.slug)}>
            {category.name}
          </button>
        ))}
      </div>

      <div className="editorial-feed-layout">
        <div className="feed-main">
          {lead ? (
            <>
              <div className="lead-label"><span>IN FOCUS</span><span className="lead-label-line" /></div>
              <StoryCard item={lead} featured />
              {remaining.length > 0 && (
                <div className="story-grid">
                  {remaining.map((item) => <StoryCard key={item.id} item={item} />)}
                </div>
              )}
            </>
          ) : (
            <div className="empty editorial-empty">No signals match that search. Try another topic or clear the filter.</div>
          )}
        </div>

        <aside className="editorial-rail">
          <div className="rail-heading"><span>THE EDITOR'S DESK</span><span>02</span></div>
          <div className="rail-feature">
            <div className="eyebrow">BEYOND THE HEADLINES</div>
            <h3>One event rarely tells the whole story.</h3>
            <p>Track the relationships between capital, talent, compute, and the next generation of AI products.</p>
            <Link className="rail-arrow-link" to="/map">Explore the signal map <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="rail-feature rail-feature-coral">
            <div className="eyebrow">THE SIGNAL LEDGER</div>
            <h3>From what's happening to what it could mean.</h3>
            <p>Read evidence-led theses, see the supporting signals, and keep the open questions in view.</p>
            <Link className="rail-arrow-link" to="/intelligence">Enter Intelligence <span aria-hidden="true">↗</span></Link>
          </div>
          {!isPremium && (
            <div className="rail-membership">
              <span className="membership-star">✳</span>
              <div className="eyebrow">FOR CURIOUS MINDS</div>
              <h3>Go one layer deeper.</h3>
              <p>Unlock the full Signal Ledger and weekly startup theses.</p>
              <ul>{PREMIUM_FEATURES.slice(0, 2).map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <Link className="btn btn-dark btn-full" to="/pricing">{t('go_premium')} <span aria-hidden="true">↗</span></Link>
            </div>
          )}
          <NewsletterBox source="sidebar" />
        </aside>
      </div>
      <div className="editorial-footer-note">
        <span>AI INDUSTRY ALPHA</span>
        <span>Signal, not certainty. Always follow the evidence.</span>
      </div>
    </div>
  )
}
