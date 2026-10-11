# AI Industry Alpha marketing automation

This folder contains the first step of a source-led marketing workflow: turn the weekly Signal Ledger brief into platform-native social drafts.

## What it does

The GitHub Actions workflow at `.github/workflows/marketing-social-drafts.yml` runs weekly or on demand. It:

1. Refreshes the last seven days of RSS source material.
2. builds the existing weekly AI Industry Alpha insights brief;
3. generates draft content for LinkedIn, X, Instagram, TikTok, and Xiaohongshu;
4. uploads a Markdown review pack and JSON output as a GitHub Actions artifact.

**It does not publish posts, create social accounts, or send emails.** A human must review every draft before publishing. This protects source accuracy and keeps hypotheses distinct from facts.

## Run it

1. Open the repository's **Actions** tab.
2. Select **Marketing Social Drafts**.
3. Choose **Run workflow**.
4. Download the `social-drafts-<run id>` artifact when the run finishes.

The workflow uses `ANTHROPIC_API_KEY` if that repository secret is configured. Without it, the script emits conservative starter drafts based on linked sources; those require substantial editorial review.

## Suggested publishing setup

- **Postiz**: use as the shared publishing calendar and distribution layer. Website: https://postiz.com/ · self-hostable app: https://github.com/gitroomhq/postiz-app
- **Metricool**: an alternative hosted scheduler and analytics dashboard. Connect it through ChatGPT when prompted if you want help inspecting schedules, analytics, and post performance.
- **n8n**: add later if you want a custom workflow that sends the reviewed JSON to Postiz or creates an approval queue. Do not auto-publish directly from this first workflow.

## Suggested channel roles

- **LinkedIn Company Page**: official publication voice; source-led industry analysis and weekly signals.
- **Personal LinkedIn profile**: founder/operator commentary and community discussion.
- **X**: short observations and source-linked threads.
- **Instagram**: carousels with one clear insight per slide.
- **TikTok**: 20–35 second explainer scripts; add a real visual/video production step before posting.
- **Xiaohongshu**: native Simplified Chinese adaptation, not a literal translation of English posts.

Account creation and platform authorization must be completed by the account owner. Do not place social tokens, passwords, or API keys in source control.

## Editorial rules

- Keep original source URLs.
- Don't turn a co-mention into a verified relationship.
- Don't imply causation, market demand, or customer willingness to pay without evidence.
- Label business ideas as hypotheses and include what could disprove them.
- Verify all factual claims, numbers, names, and dates before publishing.
- Use a clear CTA to https://aialpha.news without making every post an ad.
