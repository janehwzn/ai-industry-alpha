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
python3 fetch.py              # last 1 day (Markdown)
python3 fetch.py --days 3     # last 3 days
python3 render_html.py --days 3   # magazine-style HTML page
```

Output goes to `digests/YYYY-MM-DD.md` (Markdown) and `digests/YYYY-MM-DD.html` (styled HTML), grouped by source with titles, links, and summaries.

## GitHub Actions automation (recommended)

The repo ships with `.github/workflows/digest.yml`: every weekday at ~7:15 AM Pacific it fetches the sources, generates both the Markdown and the HTML digest, and emails the HTML version (with a plain-text fallback for email clients that don't render HTML). Mondays look back 3 days, other weekdays look back 1 day.

Two steps to enable:

1. Create a Google app-specific password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (requires 2-step verification) and copy it.
2. On the repo page, go to **Settings → Secrets and variables → Actions → New repository secret** and add:
   - `GMAIL_USER`: your Gmail address (the sender)
   - `GMAIL_APP_PASSWORD`: the app-specific password from step 1
   - Optional `RECIPIENT`: who receives the email (defaults to yourself). For multiple recipients, use a comma-separated list, e.g. `friend1@gmail.com, friend2@gmail.com` — each person gets an individual email and won't see other recipients' addresses.

Once the secrets are set, it runs automatically. You can also trigger a run manually anytime via **Actions → AI Infra Daily Digest → Run workflow**.

## Subscribe / unsubscribe (self-service)

No fork or setup needed. A bot watches new issues:

1. Open an issue titled **Subscribe** and put your email address in the body.
2. The bot validates it, adds you to `subscribers.txt`, replies, and closes the issue.
3. You'll receive the digest on weekday mornings (Pacific Time). Each subscriber gets an individual email — addresses are never shared between recipients.

To unsubscribe, open an issue titled **Unsubscribe** with your email in the body.

Note: subscriber emails are stored in `subscribers.txt` in this public repo, so they are visible to anyone.

## Local scheduling (alternative)

You can also run `fetch.py` from a local cron and send the result with `send_email.py`:

```bash
python3 fetch.py --days 1
python3 render_html.py --days 1
python3 send_email.py digests/2026-09-28.md --html digests/2026-09-28.html  # requires GMAIL_USER / GMAIL_APP_PASSWORD
```
