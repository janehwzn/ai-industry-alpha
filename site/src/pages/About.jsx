import React from 'react'
import { useLang } from '../lib/lang.jsx'

export default function About() {
  const { t } = useLang()
  return (
    <div className="page">
      <div className="article">
        <div className="section-head">{t('nav_about')}</div>
        <h1>Know which AI shifts matter — before they become consensus.</h1>
        <div className="article-body">
          <p className="lede">
            AI Industry Alpha is an independent publication tracking the AI
            industry the way an investor tracks a market: what got funded,
            who moved where, which costs collapsed, and what it all means
            for the next company to build.
          </p>
          <p>
            Every weekday, the <strong>Latest</strong> feed distills the
            day's AI news — funding rounds, model releases, infrastructure
            moves, and research breakthroughs — into one dense,
            skimmable page. No hot takes, no hype cycles; just the signal.
          </p>
          <p>
            The <strong>Signal Ledger</strong> is where the reading happens.
            Each week, the news is re-read through six angles — Money Moves,
            People Moves, AI Infra, Models, Energy &amp; Power, and Cost
            Curves — and distilled into sharp, opinionated theses, each
            with a concrete startup attack plan. Two samples are free;
            the full ledger is for members.
          </p>
          <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginTop: '1.5rem' }}>
            {t('about_author')}
          </h4>
          <p>
            AI Industry Alpha is written and built by an AI infrastructure
            engineer working in the industry — someone who reads the news
            every morning and asks "so what should get built?" This
            publication is the answer, published weekly.
          </p>
        </div>
      </div>
    </div>
  )
}
