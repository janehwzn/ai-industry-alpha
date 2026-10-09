import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/lang.jsx'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { SITE } from '../config.js'
import NewsletterBox from '../components/NewsletterBox.jsx'

function InquiryForm() {
  const { t } = useLang()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const value = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError(t('inquiry_email_invalid'))
      return
    }
    if (!name.trim() || !message.trim()) {
      setError(t('inquiry_required'))
      return
    }
    if (!isSupabaseConfigured) {
      setError(t('newsletter_not_ready'))
      return
    }
    setBusy(true)
    try {
      const { error: dbError } = await supabase
        .from('advertising_inquiries')
        .insert({
          name: name.trim(),
          email: value,
          company: company.trim() || null,
          message: message.trim(),
        })
      if (dbError) throw dbError
      setDone(true)
    } catch (err) {
      setError(err.message || t('inquiry_error'))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return <p className="form-ok">{t('inquiry_done')}</p>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
        <input
          style={inputStyle}
          placeholder={t('inquiry_name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={t('inquiry_name')}
        />
        <input
          style={inputStyle}
          type="email"
          placeholder={t('email_placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email"
        />
      </div>
      <input
        style={inputStyle}
        placeholder={t('inquiry_company')}
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        aria-label={t('inquiry_company')}
      />
      <textarea
        style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
        placeholder={t('inquiry_message')}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        aria-label={t('inquiry_message')}
      />
      <div>
        <button className="btn btn-amber" type="submit" disabled={busy}>
          {busy ? '…' : t('inquiry_send')}
        </button>
      </div>
      {error && <p className="form-err">{error}</p>}
    </form>
  )
}

export default function Advertising() {
  const { t } = useLang()
  return (
    <div className="page">
      <div className="article">
        <div className="section-head">{t('nav_advertising')}</div>
        <h1>{t('advertising_title')}</h1>
        <div className="article-body">
          <p className="lede">{t('advertising_intro')}</p>
          <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginTop: '1.5rem' }}>
            {t('advertising_audience')}
          </h4>
          <ul className="evidence-list">
            <li>{t('advertising_audience_1')}</li>
            <li>{t('advertising_audience_2')}</li>
            <li>{t('advertising_audience_3')}</li>
          </ul>
          <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginTop: '1.5rem' }}>
            {t('advertising_formats')}
          </h4>
          <ul className="evidence-list">
            <li>{t('advertising_format_1')}</li>
            <li>{t('advertising_format_2')}</li>
            <li>{t('advertising_format_3')}</li>
          </ul>
          <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginTop: '1.5rem' }}>
            {t('inquiry_title')}
          </h4>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '0.25rem 0 0' }}>
            {t('inquiry_intro')}
          </p>
          <InquiryForm />
          <p style={{ marginTop: '1.5rem', color: 'var(--muted)', fontSize: 14 }}>
            {t('advertising_cta')}{' '}
            <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent('Advertising inquiry')}`}>
              {SITE.contactEmail}
            </a>
          </p>
          <div style={{ marginTop: '2rem' }}>
            <NewsletterBox source="advertising" />
          </div>
          <p style={{ marginTop: '1.5rem' }}>
            <Link to="/" style={{ fontSize: 13.5, color: 'var(--muted)', textDecoration: 'none' }}>
              ← {t('nav_latest')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
