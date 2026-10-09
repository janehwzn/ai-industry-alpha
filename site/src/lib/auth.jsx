import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient.js'

const AuthCtx = createContext({
  user: null,
  subscription: null,
  isPremium: false,
  loading: true,
  authModal: null,
  setAuthModal: () => {},
  signInWithEmail: async () => {},
  signOut: async () => {},
  refreshSubscription: () => {},
})

async function fetchSubscription(uid) {
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', uid)
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data || null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  // null | { next?: string } — when set, the global AuthModal opens
  const [authModal, setAuthModal] = useState(null)

  const loadSubscription = useCallback(async (uid) => {
    if (!supabase || !uid) {
      setSubscription(null)
      return
    }
    try {
      setSubscription(await fetchSubscription(uid))
    } catch {
      setSubscription(null)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user || null
      setUser(u)
      if (u) loadSubscription(u.id)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) loadSubscription(u.id)
      else setSubscription(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [loadSubscription])

  const signInWithEmail = async (email) => {
    if (!supabase) throw new Error('auth-not-configured')
    // HashRouter: keep the route in the fragment, Supabase appends ?code= before it.
    const redirectTo = window.location.origin + window.location.pathname + '#/auth/callback'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) throw error
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setSubscription(null)
  }

  const isPremium =
    Boolean(subscription) &&
    ['active', 'trialing'].includes(subscription.status) &&
    (!subscription.current_period_end ||
      new Date(subscription.current_period_end) > new Date())

  return (
    <AuthCtx.Provider
      value={{
        user,
        subscription,
        isPremium,
        loading,
        authModal,
        setAuthModal,
        signInWithEmail,
        signOut,
        refreshSubscription: () => user && loadSubscription(user.id),
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}
