# AI Industry Alpha

> The briefing for people who **build** and **bet on** AI: not just what happened, but what it means — connecting the dots across infra, capital, talent, and cost curves to find startup alpha.

## What you get

- **📬 Weekday brief** (~7:15 AM PT) — the day's essential AI industry news, curated from 11 sources, in a skimmable magazine-style email. Mondays cover the weekend.
- **💰 Funding & Startups** — a dedicated section tracking raises, IPOs, acquisitions, and new startups (with a Seattle lens via GeekWire).
- **📊 Weekly Insights** (Sundays) — not just news, but signal:
  - **Trend momentum** — what's heating up vs. cooling down, with velocity vs. the 4-week baseline
  - **Bottleneck radar** — the pain points the industry keeps complaining about, clustered with evidence
  - **Dots connected** — 3 startup theses synthesized from the week's news
  - **People moves** — hiring / founding / leaving signals
- **🤫 Quiet-day skip** — if more than half the sources have no fresh stories, no email goes out. No thin digests.

## Recent highlights

- British AI neocloud **Nscale secures $3.36B** in convertible financing ahead of its US IPO
- Enterprise browser startup **Island raises $400M** at a $6.4B valuation (Series F)
- **Databricks acquires** Seattle spreadsheet startup Row Zero
- 25 startups pitch investors at **AI House Seattle** — "Seattle's answer to YC Demo Day"

## Subscribe

This repo is now **private** and subscription is invite-only. Subscriber emails live in `subscribers.txt` (visible only to collaborators).

Previously, subscription worked via GitHub issues on the public repo — that flow is retired with the move to private.

## Sources

| Source | Type |
|--------|------|
| SemiAnalysis | Industry analysis |
| Latent Space | Newsletter |
| Import AI | Newsletter |
| TLDR AI | Newsletter |
| Anyscale Blog | Company blog |
| Modal Blog | Company blog |
| vLLM Releases | Open-source project |
| SGLang Releases | Open-source project |
| TechCrunch AI | Funding & startups (filtered) |
| SiliconANGLE | Funding & startups (filtered) |
| GeekWire | Funding & startups (filtered) |

## How it works

Everything runs on GitHub Actions — no server to maintain:

- **Daily brief** (`.github/workflows/digest.yml`): weekdays at ~7:15 AM PT, fetches all sources, renders Markdown + HTML, and emails the HTML version (with a plain-text fallback).
- **Archive**: every run appends new items to `data/archive.jsonl`, so trends compound over time. Meaningful momentum signals emerge after 2–3 weeks.
- **Weekly Insights** (`.github/workflows/insights.yml`): Sundays ~7:15 AM PT, distills trend momentum, bottleneck radar, startup theses, and people moves from the archive.

### Self-host it

1. Create a Google app-specific password ([myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
2. Add repo secrets: `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and optionally `RECIPIENT` (comma-separated for multiple recipients — each gets an individual email).
3. It runs automatically. Trigger manually anytime via **Actions → AI Industry Alpha → Run workflow**.

### Local usage

```bash
pip install -r requirements.txt
python3 fetch.py --days 1        # Markdown digest
python3 render_html.py --days 1  # styled HTML email
```

## Preview

![Newsletter preview](assets/newsletter-preview.png)

## Website

Seeking Alpha-style subscription site in `site/` — headlines feed, premium
Signal Ledger, magic-link login, newsletter signup, Stripe payments.
Deploys to GitHub Pages via `.github/workflows/site.yml` (repo Settings →
Pages → Source: GitHub Actions). Full setup guide: `site/SETUP.md`.
