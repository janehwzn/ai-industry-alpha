import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './lib/lang.jsx'
import { AuthProvider } from './lib/auth.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import AuthModal from './components/AuthModal.jsx'
import SubscribePopup from './components/SubscribePopup.jsx'
import Home from './pages/Home.jsx'
import Article from './pages/Article.jsx'
import Theses from './pages/Theses.jsx'
import Thesis from './pages/Thesis.jsx'
import Pricing from './pages/Pricing.jsx'
import Account from './pages/Account.jsx'
import AuthCallback from './pages/AuthCallback.jsx'

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <HashRouter>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<Article />} />
              <Route path="/theses" element={<Theses />} />
              <Route path="/thesis/:id" element={<Thesis />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/account" element={<Account />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
          <AuthModal />
          <SubscribePopup />
        </HashRouter>
      </AuthProvider>
    </LangProvider>
  )
}
