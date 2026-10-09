import React, { createContext, useContext, useEffect } from 'react'
import { STRINGS } from '../i18n.js'

// English-only (product decision Oct 2026): the language toggle was removed,
// so this provider is locked to 'en'. Chinese strings remain in i18n.js,
// dormant, in case we ever bring the toggle back.
const LangCtx = createContext({ lang: 'en', setLang: () => {}, t: (k) => k })

export function LangProvider({ children }) {
  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])
  const t = (k) => STRINGS.en[k] || k
  return <LangCtx.Provider value={{ lang: 'en', setLang: () => {}, t }}>{children}</LangCtx.Provider>
}

export function useLang() {
  return useContext(LangCtx)
}
