import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadData, excerpt, timeAgo } from '../lib/data.js'
import { useSearchParams } from 'react-router-dom'
import { buildSignalGraph, matchEvidenceStories } from '../lib/signalGraph.js'
import { buildFounderSignals } from '../lib/founderSignals.js'

export default function Intelligence() {
  const [data, setData] = useState(null)
  const [params] = useSearchParams()
  const graph = useMemo(() => buildSignalGraph(data?.headlines || []), [data])
  const requestedEntity = graph.getNode(params.get('entity'))
  const founderSignals = useMemo(() => buildFounderSignals(data?.headlines || []), [data])

  useEffect(() => {
    loadData().then(setData).catch(() => setData({ headlines: [], theses: [], meta: {} }))
  }, [])

  if (!data) return <div className="page"><div className="loading">Assembling the evidence…</div></div>

  const theses = data.theses || []
  const samples = theses.filter((thesis) => thesis.sample)
  const locked = theses.filter((thesis) => !thesis.sample)
  const overlapEdges = graph.edges.slice().sort((a, b) => b.storyCount - a.storyCount).slice(0, 4)

  return (
    <div className="page intelligence-page">
      <div className="page-kicker"><span className="eyebrow-dot" /> FIELD GUIDE / 02</div>
      <section className="subpage-hero intelligence-hero">
        <div>
          <div className="eyebrow">THE SIGNAL LEDGER</div>
          <h1>From the news<br />to <em>what it means.</em></h1>
          <p>Evidence-led theses about where AI is heading. See the supporting signals, understand the argument, and keep the unknowns visible.</p>
          <div className="hero-actions"><Link className="btn btn-lime" to="/pricing">Unlock the full ledger ↗</Link><Link className="text-link" to="/map">Back to the map ↓</Link></div>
        </div>
        <div className="intelligence-hero-note">
          <span className="note-mark">“</span>
          <p>A thesis is a hypothesis to test—not a prediction to take on faith.</p>
          <span className="note-rule" />
          <small>THE EDITORIAL PRINCIPLE</small>
        </div>
      </section>

      <section className="intelligence-method">
        <div><span className="method-number">01</span><b>Signal</b><p>What happened, with links back to the source.</p></div>
        <div><span className="method-number">02</span><b>Thesis</b><p>A point of view that connects multiple events.</p></div>
        <div><span className="method-number">03</span><b>Open questions</b><p>What still needs evidence before the idea holds.</p></div>
      </section>

      <section className="founder-brief-section">
        <div className="founder-brief-heading">
          <div><div className="eyebrow">THE FOUNDER'S DESK / WEEKLY RADAR</div><h2>What I'd investigate next<span className="heading-period">.</span></h2>
            <p>Signals from the current archive, translated into questions a founder can actually test. These are research leads—not claims of validated demand.</p></div>
          <div className="founder-brief-stats"><strong>{founderSignals.recentCount}</strong><span>STORIES / 7 DAYS</span><small>{(data.meta?.sources || []).length} tracked sources in the archive</small></div>
        </div>
        <div className="founder-signal-grid">
          {founderSignals.topics.slice(0, 4).map((topic) => <article className="founder-signal-card" key={topic.id}>
            <div className="founder-card-top"><span className="eyebrow">SIGNAL RADAR</span><span className={topic.status === 'Accelerating coverage' ? 'signal-status accelerating' : 'signal-status'}>{topic.status}</span></div>
            <h3>{topic.name}</h3>
            <div className="founder-signal-metrics"><strong>{topic.currentCount}</strong><span>matching stories in 7 days</span><span className="metric-divider">/</span><span>{topic.sources} sources</span></div>
            <p className="founder-question">{topic.question}</p>
            <div className="founder-evidence-list">{topic.stories.slice(0, 2).map((story) => <Link key={story.id} to={`/article/${story.id}`}><span>{story.source} / {timeAgo(story.pub)}</span><b>{story.title}</b></Link>)}</div>
          </article>)}
          {founderSignals.topics.length === 0 && <div className="founder-empty">Not enough recent, multi-source coverage to rank a strong signal yet. That's preferable to manufacturing a trend from one headline.</div>}
        </div>
        <p className="founder-method-note">How to read this: topic counts are keyword-matched headlines, not market size or customer demand. “Accelerating” means coverage is running above the prior 23-day weekly average; it does not prove the underlying market is accelerating.</p>
      </section>

      <section className="founder-opportunity-section">
        <div className="section-overline"><span>01</span><h2>Startup wedges worth pressure-testing<span className="heading-period">.</span></h2></div>
        <p className="ledger-intro">I would use these as customer-discovery hypotheses, then try to disprove them. Each card links to recent coverage that motivated the question.</p>
        <div className="founder-opportunity-grid">
          {founderSignals.opportunities.slice(0, 4).map((topic) => <article className="founder-opportunity-card" key={topic.id}>
            <div className="eyebrow">HYPOTHESIS / VALIDATE WITH CUSTOMERS</div><h3>{topic.name}</h3><p>{topic.question}</p>
            <div className="opportunity-evidence-count">{topic.evidenceCount} matching stories · {topic.sources} distinct sources in 30 days</div>
            {topic.stories.slice(0, 2).map((story) => <Link className="opportunity-source" key={story.id} to={`/article/${story.id}`}><span>{story.source}</span><b>{story.title}</b></Link>)}
            <div className="opportunity-test"><b>First test</b><span>Interview 5–8 target buyers. Ask how they solve this today, what failure costs, who owns the budget, and what evidence would make them switch.</span></div>
          </article>)}
          {founderSignals.opportunities.length === 0 && <div className="founder-empty">The archive does not yet have enough cross-source evidence for these opportunity hypotheses. Expand the time window or wait for more coverage rather than overstating the signal.</div>}
        </div>
      </section>

      <section className="founder-watch-section">
        <div className="section-overline"><span>02</span><h2>Events that can change a founder's plan<span className="heading-period">.</span></h2></div>
        <p className="ledger-intro">A compact catalyst watchlist: launches, pricing changes, fundraises, acquisitions, open-source releases, and benchmarks. These can change build-vs-buy decisions or competitor positioning.</p>
        <div className="founder-watch-list">{founderSignals.watchItems.slice(0, 6).map((story) => <Link className="founder-watch-row" key={story.id} to={`/article/${story.id}`}>
          <span className="founder-watch-date">{timeAgo(story.pub)}</span><span className="founder-watch-source">{story.source || 'Source'}</span><b>{story.title}</b><span className="founder-watch-arrow">↗</span>
        </Link>)}
          {founderSignals.watchItems.length === 0 && <div className="founder-empty">No matching catalysts in the recent archive.</div>}
        </div>
      </section>

      <section className="source-expansion-section">
        <div><div className="eyebrow">SOURCE STRATEGY</div><h2>Track the builders, not just the coverage.</h2><p>Official lab announcements tell us what vendors want to ship. Research, release notes, and infrastructure blogs help test what is technically changing. Funding and launch coverage adds commercial context.</p></div>
        <div className="source-lanes-grid">
          <div><b>Primary lab signals</b><p>OpenAI, Anthropic, Google DeepMind, Microsoft Research.</p><span>Model capability, product launches, safety limits, research direction.</span></div>
          <div><b>Infrastructure economics</b><p>NVIDIA, AWS Machine Learning, SemiAnalysis, Modal, Anyscale.</p><span>Compute availability, serving costs, latency, deployment constraints.</span></div>
          <div><b>Developer adoption</b><p>Hugging Face, vLLM, SGLang, Transformers, Ollama, LiteLLM, GitHub.</p><span>Release velocity, integration friction, ecosystem adoption signals.</span></div>
          <div><b>Commercial validation</b><p>TechCrunch, GeekWire, YC, Hacker News.</p><span>Funding, launches, hiring, and competitive moves. SEC filing extraction is a planned next step.</span></div>
        </div>
        <p className="founder-method-note">The source list is a mix of primary sources and reporting. A launch or GitHub release is a product signal—not proof of adoption. The next data layer should add usage evidence, hiring changes, pricing history, and customer proof points where public data is available.</p>
      </section>

      {requestedEntity && (
        <section className="entity-intelligence-panel">
          <div className="eyebrow">FOLLOWING FROM THE SIGNAL MAP</div>
          <h2>{requestedEntity.name}: the wider coverage<span className="heading-period">.</span></h2>
          <p>{requestedEntity.storyCount} stories mention this entity in their title or summary. Start with these source-linked signals, then use the map to inspect co-mentions.</p>
          <div className="entity-intelligence-stories">{requestedEntity.stories.slice(0, 4).map((story) => <Link key={story.id} to={`/article/${story.id}`}><span>{story.source} / {timeAgo(story.pub)}</span><b>{story.title}</b></Link>)}</div>
          <Link className="rail-arrow-link" to={`/map?entity=${requestedEntity.id}`}>Return to the connection graph ↗</Link>
        </section>
      )}

      <section className="live-overlaps-section">
        <div className="section-overline"><span>00</span><h2>Coverage overlaps to investigate<span className="heading-period">.</span></h2></div>
        <p className="ledger-intro">These pairs share one or more source stories in the current archive. Treat them as research leads—not verified business relationships.</p>
        <div className="live-overlaps-grid">{overlapEdges.map((edge) => {
          const left = graph.getNode(edge.source), right = graph.getNode(edge.target)
          return <article className="live-overlap-card" key={edge.id}>
            <div className="eyebrow">{edge.context}</div><h3>{left?.name} <span>&</span> {right?.name}</h3>
            <p>Appeared together in {edge.storyCount} {edge.storyCount === 1 ? 'source story' : 'source stories'}.</p>
            {edge.stories.slice(0, 2).map((story) => <Link key={story.id} to={`/article/${story.id}`} className="overlap-source"><span>{story.source} / {timeAgo(story.pub)}</span><b>{story.title}</b></Link>)}
            <Link className="rail-arrow-link" to={`/map?entity=${edge.source}`}>Inspect source trail ↗</Link>
          </article>
        })}</div>
      </section>

      <section className="ledger-section">
        <div className="section-overline"><span>01</span><h2>Start with the evidence<span className="heading-period">.</span></h2></div>
        <p className="ledger-intro">A few current theses are open to explore. Each analysis stays connected to the source material available in the ledger.</p>
        <div className="ledger-grid">
          {samples.map((thesis, index) => (
            <article className="ledger-card" key={thesis.id}>
              <div className="ledger-card-top"><span className="ledger-index">{String(index + 1).padStart(2, '0')}</span><span className="ledger-open-label">OPEN SAMPLE ↗</span></div>
              <div className="eyebrow">{thesis.section || 'INDUSTRY THESIS'}{thesis.week ? ` / WEEK OF ${thesis.week}` : ''}</div>
              <h3>{thesis.thesis}</h3>
              <p>{excerpt(thesis.why_now || thesis.excerpt || '', 220)}</p>
              {thesis.evidence?.length > 0 && (
                <div className="evidence-preview">
                  <span className="eyebrow">EVIDENCE TRAIL</span>
                  <ul>{matchEvidenceStories(thesis.evidence.slice(0, 3), data.headlines || []).map(({ claim, story }, i) => <li key={i}>{story ? <Link to={`/article/${story.id}`}>{story.title} ↗</Link> : claim}</li>)}</ul>
                </div>
              )}
              <Link className="rail-arrow-link" to={`/thesis/${thesis.id}`}>Read the analysis <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="locked-ledger">
        <div className="locked-ledger-heading"><div><div className="eyebrow">THE FULL SIGNAL LEDGER</div><h2>More theses. More angles.</h2></div><span className="lock-mark">✳</span></div>
        <p>Explore the complete analysis across money, talent, infrastructure, models, energy, and cost curves.</p>
        <div className="locked-thesis-list">
          {locked.slice(0, 4).map((thesis) => (
            <Link to={`/thesis/${thesis.id}`} className="locked-thesis-row" key={thesis.id}>
              <span className="locked-thesis-icon">↗</span>
              <span><small>{thesis.section || 'AI INDUSTRY'}</small><b>{thesis.thesis}</b></span>
              <span className="locked-thesis-gate">MEMBERS</span>
            </Link>
          ))}
        </div>
        <Link className="btn btn-dark" to="/pricing">Unlock the full Signal Ledger ↗</Link>
      </section>
      <p className="intelligence-disclaimer">These theses are editorial hypotheses based on the listed signals. They are not investment advice, and confidence should follow evidence—not presentation.</p>
    </div>
  )
}
