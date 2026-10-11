import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const EVENT_TYPES = [
  { id: 'funding', label: 'Funding & M&A', pattern: /\b(raises?|raised|funding|series [a-f]|seed round|valuation|acquir(?:e|es|ed|ition)|merger|ipo|investment round|venture round)\b/i },
  { id: 'pricing', label: 'Product & pricing', pattern: /\b(pricing|price cut|price drop|launch(?:es|ed)?|general availability|available now|introduces?|unveils?|announces? .* product|new product|api release|product release)\b/i },
  { id: 'models', label: 'Models & research', pattern: /\b(model|benchmark|reasoning|multimodal|training run|research paper|arxiv|context window|open weights|frontier model)\b/i },
  { id: 'opensource', label: 'Open-source releases', pattern: /\b(open[- ]source|github|released?|release notes|version \d|v\d+\.\d+|ollama|vllm|sglang|transformers)\b/i },
  { id: 'compute', label: 'Infrastructure & compute', pattern: /\b(gpu|data ?cent(?:er|re)|compute|inference|chip|cluster|capacity|power deal|cloud region|datacenter)\b/i },
]

const timestamp = (story) => {
  const value = new Date(story.pub || story.date || 0).getTime()
  return Number.isFinite(value) ? value : 0
}

function classify(story) {
  const text = `${story.title || ''} ${story.summary || ''}`
  const matches = EVENT_TYPES.filter((type) => type.pattern.test(text))
  if (!matches.length) return null
  // Keep one primary event label so the timeline is readable and counts aren't inflated.
  const primary = matches[0]
  return { ...primary, matchedTypes: matches.map((item) => item.id) }
}

function monthLabel(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default function EventHistory({ headlines = [] }) {
  const [activeType, setActiveType] = useState('all')
  const [windowDays, setWindowDays] = useState('365')
  const events = useMemo(() => {
    const cutoff = Date.now() - Number(windowDays) * 24 * 60 * 60 * 1000
    const seen = new Set()
    return headlines
      .filter((story) => timestamp(story) >= cutoff && timestamp(story) <= Date.now() + 24 * 60 * 60 * 1000)
      .map((story) => ({ ...story, event: classify(story) }))
      .filter((story) => story.event)
      .filter((story) => activeType === 'all' || story.event.matchedTypes.includes(activeType))
      .filter((story) => {
        const key = story.link || story.id || story.title
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => timestamp(b) - timestamp(a))
  }, [headlines, activeType, windowDays])

  const groups = useMemo(() => {
    const grouped = new Map()
    for (const story of events) {
      const label = monthLabel(story.pub || story.date)
      if (!grouped.has(label)) grouped.set(label, [])
      grouped.get(label).push(story)
    }
    return [...grouped.entries()]
  }, [events])

  const typeCounts = useMemo(() => Object.fromEntries([
    ['all', headlines.filter((story) => timestamp(story) >= Date.now() - Number(windowDays) * 86400000 && classify(story)).length],
    ...EVENT_TYPES.map((type) => [type.id, headlines.filter((story) => timestamp(story) >= Date.now() - Number(windowDays) * 86400000 && classify(story)?.matchedTypes.includes(type.id)).length]),
  ]), [headlines, windowDays])

  return (
    <section className="event-history-section">
      <div className="section-overline"><span>03</span><h2>The event history<span className="heading-period">.</span></h2></div>
      <p className="ledger-intro">A searchable-by-category timeline of public moves that may change a founder's build, buy, or compete decisions. Every item links to its source.</p>
      <div className="event-history-toolbar">
        <div className="event-history-filters" role="group" aria-label="Filter event history">
          <button type="button" className={activeType === 'all' ? 'event-filter active' : 'event-filter'} onClick={() => setActiveType('all')}>All events <span>{typeCounts.all || 0}</span></button>
          {EVENT_TYPES.map((type) => <button type="button" key={type.id} className={activeType === type.id ? 'event-filter active' : 'event-filter'} onClick={() => setActiveType(type.id)}>{type.label}<span>{typeCounts[type.id] || 0}</span></button>)}
        </div>
        <label className="event-history-window">Look back
          <select value={windowDays} onChange={(event) => setWindowDays(event.target.value)}>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="180">6 months</option>
            <option value="365">12 months</option>
          </select>
        </label>
      </div>
      <div className="event-history-summary"><b>{events.length}</b> tagged events <span>·</span> grouped by month <span>·</span> source-linked</div>
      {groups.length ? <div className="event-history-timeline">
        {groups.map(([month, stories]) => <div className="event-history-month" key={month}>
          <div className="event-month-heading"><h3>{month}</h3><span>{stories.length} {stories.length === 1 ? 'event' : 'events'}</span></div>
          <div className="event-month-items">
            {stories.map((story) => <article className="event-history-row" key={story.id || story.link}>
              <time dateTime={story.pub}>{new Date(story.pub).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</time>
              <span className={`event-type-pill event-type-${story.event.id}`}>{story.event.label}</span>
              <div className="event-history-story"><Link to={`/article/${story.id}`}>{story.title}</Link><p>{story.source || 'Source'}{story.summary ? ` · ${story.summary}` : ''}</p></div>
              <a className="event-source-link" href={story.link} target="_blank" rel="noreferrer" aria-label={`Open original source: ${story.title}`}>↗</a>
            </article>)}
          </div>
        </div>)}
      </div> : <div className="founder-empty">No tagged events match this filter and time window. Try a broader window or another event category.</div>}
      <p className="founder-method-note">Method note: event categories are assigned with transparent keyword rules over headlines and summaries. They are useful for navigation, not verified structured facts; check the linked source before treating a date, price, funding amount, or product change as confirmed. The timeline only covers stories in the current archive.</p>
    </section>
  )
}
