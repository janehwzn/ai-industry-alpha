import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useLang } from '../lib/lang.jsx'
import { SITE, stripeConfigured } from '../config.js'
import TickerTape from './TickerTape.jsx'

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
