import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './lib/lang.jsx'
import { AuthProvider } from './lib/auth.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import AuthModal from './components/AuthModal.jsx'
import SubscribePopup from './components/SubscribePopup.jsx'
import Home from './pages/Home.jsx'
import MapPage from './pages/Map.jsx'
import Intelligence from './pages/Intelligence.jsx'
import Article from './pages/Article.jsx'
import Category from './pages/Category.jsx'
import Theses from './pages/Theses.jsx'
import Thesis from './pages/Thesis.jsx'
import Pricing from './pages/Pricing.jsx'
import Account from './pages/Account.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Advertising from './pages/Advertising.jsx'

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <HashRouter>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/intelligence" element={<Intelligence />} />
              <Route path="/article/:id" element={<Article />} />
              <Route path="/category/:slug" element={<Category />} />
              <Route path="/theses" element={<Theses />} />
              <Route path="/thesis/:id" element={<Thesis />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/account" element={<Account />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/advertising" element={<Advertising />} />
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
