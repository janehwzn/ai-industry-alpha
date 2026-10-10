import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useLang } from '../lib/lang.jsx'
import { SITE } from '../config.js'
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
  }, [open])

  const items = [
    { to: '/theses', label: 'Signal Ledger archive' },
    { to: '/about', label: t('nav_about') },
    { to: '/advertising', label: t('nav_advertising') },
    { to: '/contact', label: t('nav_contact') },
  ]

  return (
    <div className="nav-dropdown" ref={ref}>
      <button type="button" className="nav-dropdown-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {t('nav_more')} <span className="caret">▾</span>
      </button>
      {open && <div className="nav-dropdown-menu">{items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setOpen(false)}>
          {item.label}
        </NavLink>
      ))}</div>}
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
      <header className="masthead editorial-masthead">
        <div className="masthead-inner">
          <Link className="logo editorial-logo" to="/">
            <span className="logo-mark"><span>α</span></span>
            <span className="logo-text">
              <span className="logo-name">AI Industry <em>Alpha</em></span>
              <span className="logo-tag">INDEPENDENT AI INDUSTRY INTELLIGENCE</span>
            </span>
          </Link>
          <nav className="nav editorial-nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Feed</NavLink>
            <NavLink to="/map" className={({ isActive }) => (isActive ? 'active' : '')}>The Map</NavLink>
            <NavLink to="/intelligence" className={({ isActive }) => (isActive ? 'active' : '')}>Intelligence</NavLink>
            <NavLink to="/pricing" className={({ isActive }) => (isActive ? 'active' : '')}>Membership</NavLink>
            <MoreMenu />
          </nav>
          <span className="masthead-spacer" />
          {!loading && (user ? (
            <>
              <Link className="btn btn-ghost btn-sm editorial-account" to="/account">{t('account')}</Link>
              <button className="btn btn-ghost btn-sm editorial-account" onClick={handleSignOut}>{t('sign_out')}</button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm editorial-account" onClick={() => setAuthModal({})}>{t('sign_in')}</button>
          ))}
          <Link className="btn btn-lime btn-sm masthead-cta" to="/pricing">Go deeper <span aria-hidden="true">↗</span></Link>
        </div>
      </header>
    </>
  )
}
