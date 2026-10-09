import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useLang } from '../lib/lang.jsx'
import { SITE, stripeConfigured } from '../config.js'
import TickerTape from './TickerTape.jsx'

function MoreMenu() {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open ])

  const items = [
    { to: '/about', label: t('nav_about') },
    { to: '/advertising', label: t('nav_advertising') },
    { to: '/contact', label: t('nav_contact') },
  ]
  return (
    <div className="nav-dropdown" ref={ref}>
      <button
        type="button"
        className="nav-dropdown-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {t('nav_more')} <span className="caret">▾</span>
      </button>
      {open && (
        <div className="nav-dropdown-menu">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setOpen(false)}
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Header({ topics }) {
  const { user, loading, setAuthModal, signOut } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <TickerTape topics={topics} />
      <header className="masthead">
        <div className="masthead-inner">
          <Link className="logo" to="/">
            <span className="logo-mark">α</span>
            <span className="logo-text">
              <span className="logo-name">
                AI Industry <em>Alpha</em>
              </span>
              <br />
              <span className="logo-tag">{SITE.tagline}</span>
            </span>
          </Link>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              {t('nav_latest')}
            </NavLink>
            <NavLink to="/theses" className={({ isActive }) => (isActive ? 'active' : '')}>
              🔒 {t('nav_theses')}
            </NavLink>
            <NavLink to="/pricing" className={({ isActive }) => (isActive ? 'active' : '')}>
              {t('nav_pricing')}
            </NavLink>
            <MoreMenu />
          </nav>
          <span className="masthead-spacer" />
          {!loading &&
            (user ? (
              <>
                <Link className="btn btn-ghost btn-sm" to="/account">
                  {t('account')}
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
                  {t('sign_out')}
                </button>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setAuthModal({})}>
                {t('sign_in')}
              </button>
            ))}
          <Link className="btn btn-amber btn-sm" to="/pricing">
            {t('go_premium')}
          </Link>
        </div>
      </header>
    </>
  )
}
