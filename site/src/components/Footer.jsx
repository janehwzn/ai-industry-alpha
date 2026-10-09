import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/lang.jsx'
import { SITE } from '../config.js'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h4>AI Industry Alpha</h4>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 380 }}>
            {SITE.tagline}
          </p>
        </div>
        <div>
          <h4>Product</h4>
          <ul>
            <li><Link to="/">{t('nav_latest')}</Link></li>
            <li><Link to="/theses">{t('nav_theses')}</Link></li>
            <li><Link to="/pricing">{t('nav_pricing')}</Link></li>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">{t('nav_about')}</Link></li>
            <li><Link to="/contact">{t('nav_contact')}</Link></li>
            <li><Link to="/advertising">{t('nav_advertising')}</Link></li>
            <li><a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></li>
          </ul>
        </div>
      </div>
      <div className="fine">© 2026 AI Industry Alpha. All rights reserved.</div>
    </footer>
  )
}
