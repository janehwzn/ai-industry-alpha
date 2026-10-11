import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { SITE } from '../config.js'

// B2B offer: a paid pilot of a custom AI intelligence briefing for VC firms,
// corporate strategy and AI product teams. Requests are stored in the existing
// advertising_inquiries table (tagged "[Briefing pilot]") so the existing
// inquiry-notifier workflow emails the owner — no schema change needed.

const DELIVERABLES = [
  'A source-linked weekly briefing focused on your sectors, competitors, or theses',
  'Every claim labelled: reported fact, third-party claim, our analysis, or hypothesis',
  'What changed, why it may matter for your decisions, and what to verify next',
  'A short call each month to refine the watchlist and questions',
]

const FOR_WHO = [
  'Seed–Series B investors tracking AI infrastructure, models, and tooling',
  'Corporate strategy and corp-dev teams watching AI competitors and partners',
  'AI startup founders and product leaders who need a sharper market radar',
]

function PilotForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [focus, setFocus] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const value = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('Please enter a valid work email.')
      return
    }
    if (!name.trim() || !focus.trim()) {
      setError('Please add your name and what you would like us to track.')
      return
    }
    if (!isSupabaseConfigured) {
      setError(`The form is not available right now — please email ${SITE.contactEmail}.`)
      return
    }
    setBusy(true)
    try {
      const { error: dbError } = await supabase.from('advertising_inquiries').insert({
        name: name.trim(),
        email: value,
        company: company.trim() || null,
        message: `[Briefing pilot] ${focus.trim()}`,
      })
      if (dbError) throw dbError
      setDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p className="form-ok">
        Thanks — we will reply by email to set up a short call and send a sample briefing.
      </p>
    )
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.65rem 0.8rem',
    fontSize: 15,
    border: '1px solid var(--line)',
    borderRadius: 8,
    background: '#fff',
    color: 'var(--ink)',
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
        <input style={inputStyle} placeholder="Your name" value={name}
          onChange={(e) => setName(e.target.value)} aria-label="Your name" />
        <input style={inputStyle} type="email" placeholder="Work email" value={email}
          onChange={(e) => setEmail(e.target.value)} aria-label="Work email" />
      </div>
      <input style={inputStyle} placeholder="Firm / company (optional)" value={company}
        onChange={(e) => setCompany(e.target.value)} aria-label="Firm or company" />
      <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
        placeholder="What should we track for you? (sectors, companies, theses, decisions coming up)"
        value={focus} onChange={(e) => setFocus(e.target.value)} aria-label="What to track" />
      <div>
        <button className="btn btn-amber" type="submit" disabled={busy}>
          {busy ? '…' : 'Request a sample briefing'}
        </button>
      </div>
      {error && <p className="form-err">{error}</p>}
    </form>
  )
}

export default function Briefing() {
  const h4 = { fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginTop: '1.5rem' }
  return (
    <div className="page">
      <div className="article">
        <div className="section-head">For teams</div>
        <h1>AI Intelligence Briefing for investors and strategy teams</h1>
        <div className="article-body">
          <p className="lede">
            A custom, source-linked briefing on the AI shifts that matter to your portfolio, market, or roadmap —
            before they become consensus.
          </p>

          <h4 style={h4}>Who it is for</h4>
          <ul className="evidence-list">{FOR_WHO.map((x) => <li key={x}>{x}</li>)}</ul>

          <h4 style={h4}>What you get</h4>
          <ul className="evidence-list">{DELIVERABLES.map((x) => <li key={x}>{x}</li>)}</ul>

          <h4 style={h4}>Pilot</h4>
          <p>
            Start with a paid pilot (from $1,500) scoped on a 20-minute call. If it is not useful for your decisions,
            we stop — no long contract. Briefings are research and analysis, not investment advice.
          </p>
          <p>
            Want to see the style first? Browse the free <Link to="/intelligence">Intelligence</Link> page and the{' '}
            <Link to="/theses">Signal Ledger</Link>.
          </p>

          <h4 style={h4}>Request a sample</h4>
          <PilotForm />
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: '1rem' }}>
            Prefer email? <a href={`mailto:${SITE.contactEmail}?subject=Briefing%20pilot`}>{SITE.contactEmail}</a>
          </p>
        </div>
      </div>
    </div>
  )
}
