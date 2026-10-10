import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadData, excerpt } from '../lib/data.js'

export default function Intelligence() {
  const [data, setData] = useState(null)

  useEffect(() => {
    loadData().then(setData).catch(() => setData({ headlines: [], theses: [], meta: {} }))
  }, [])

  if (!data) return <div className="page"><div className="loading">Assembling the evidence…</div></div>

  const theses = data.theses || []
  const samples = theses.filter((thesis) => thesis.sample)
  const locked = theses.filter((thesis) => !thesis.sample)

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
                  <ul>{thesis.evidence.slice(0, 3).map((evidence, i) => <li key={i}>{evidence}</li>)}</ul>
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
