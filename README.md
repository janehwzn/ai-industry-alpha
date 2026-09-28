# AI Infra Daily Digest

A daily aggregated digest of AI infrastructure news: inference serving, GPU scheduling, orchestration, cost optimization, and data centers.

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

## Usage

```bash
pip install -r requirements.txt
python3 fetch.py              # last 3 days
python3 fetch.py --days 1     # last 1 day
python3 fetch.py --out digests/ --days 7
```

Output goes to `digests/YYYY-MM-DD.md`, grouped by source with titles, links, and summaries.

## GitHub Actions automation (recommended)

The repo ships with `.github/workflows/digest.yml`: every weekday at ~7:15 AM Pacific it fetches the sources, generates the digest, and emails it. Mondays look back 3 days, other weekdays look back 1 day.

Two steps to enable:

1. Create a Google app-specific password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (requires 2-step verification) and copy it.
2. On the repo page, go to **Settings → Secrets and variables → Actions → New repository secret** and add:
   - `GMAIL_USER`: your Gmail address (the sender)
   - `GMAIL_APP_PASSWORD`: the app-specific password from step 1
   - Optional `RECIPIENT`: who receives the email (defaults to yourself)

Once the secrets are set, it runs automatically. You can also trigger a run manually anytime via **Actions → AI Infra Daily Digest → Run workflow**.

## Local scheduling (alternative)

You can also run `fetch.py` from a local cron and send the result with `send_email.py`:

```bash
python3 fetch.py --days 1
python3 send_email.py digests/2026-09-28.md  # requires GMAIL_USER / GMAIL_APP_PASSWORD
```
