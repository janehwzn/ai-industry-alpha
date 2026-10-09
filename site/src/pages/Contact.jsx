import React from 'react'
import { useLang } from '../lib/lang.jsx'
import { SITE } from '../config.js'

export default function Contact() {
  const { t } = useLang()
  return (
    <div className="page">
      <div className="article">
        <div className="section-head">{t('nav_contact')}</div>
        <h1>{t('contact_title')}</h1>
        <div className="article-body">
          <p className="lede">{t('contact_intro')}</p>
          <p>
            <strong>{t('contact_email_label')}:</strong>{' '}
            <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {t('contact_note')}
          </p>
        </div>
      </div>
    </div>
  )
}
