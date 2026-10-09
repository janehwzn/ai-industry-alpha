import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/lang.jsx'
import { SITE } from '../config.js'
import NewsletterBox from '../components/NewsletterBox.jsx'

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
          <p>
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
