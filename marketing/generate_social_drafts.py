#!/usr/bin/env python3
"""Turn a weekly AI Industry Alpha signal brief into platform-specific review drafts.

No social posts are published by this script. Output is a Markdown review pack and
JSON payload suitable for a human review step or later Postiz integration.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path

SITE_URL = "https://aialpha.news"
PLATFORMS = ["linkedin", "x", "instagram", "tiktok", "xiaohongshu"]


def source_links(markdown: str) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    seen: set[str] = set()
    for title, url in re.findall(r"\[([^\]]+)\]\((https?://[^)]+)\)", markdown):
        if url not in seen:
            links.append({"title": title.strip(), "url": url.strip()})
            seen.add(url)
    return links[:20]


def fallback_pack(markdown: str, date: str) -> dict:
    """Safe fallback: do not invent analysis if the LLM key is unavailable."""
    links = source_links(markdown)
    if not links:
        links = [{"title": "This week's AI industry signals", "url": SITE_URL}]
    lead = links[0]
    return {
        "date": date,
        "status": "fallback_review_required",
        "note": "ANTHROPIC_API_KEY was unavailable or generation failed. Replace these conservative starter drafts with reviewed analysis before publishing.",
        "sources": links,
        "drafts": {
            "linkedin": {
                "title": "This week's AI industry signals",
                "text": (
                    "What changed in AI this week—and what might it mean for the people building in this space?\n\n"
                    f"One signal worth examining: {lead['title']}\n"
                    f"Source: {lead['url']}\n\n"
                    "A single announcement is not proof of market demand. The useful next step is to identify who has the problem, whether they have budget, and what evidence would disprove the opportunity.\n\n"
                    f"More source-linked signals: {SITE_URL}\n\n"
                    "#AI #AIInfrastructure #Startups"
                ),
            },
            "x": {
                "title": "Weekly AI signal",
                "text": (
                    f"1/ One AI industry signal to examine this week: {lead['title']}\n{lead['url']}\n\n"
                    "2/ The announcement itself is evidence of an event—not proof of customer demand. What buyer pain, budget, and disconfirming evidence should founders look for?\n\n"
                    f"3/ More source-linked signals: {SITE_URL}"
                ),
            },
            "instagram": {
                "title": "This week's AI signal",
                "carousel": [
                    "Cover: One AI signal worth watching",
                    f"Signal: {lead['title']}",
                    f"Source: {lead['url']}",
                    "Founder lens: Who has this problem urgently enough to pay?",
                    "What would disprove the opportunity?",
                    f"Explore more at {SITE_URL}",
                ],
                "caption": f"One signal is a starting point, not a conclusion. Follow the source, test the buyer pain, and look for evidence that could change your mind. More at {SITE_URL} #AI #Startups",
            },
            "tiktok": {
                "title": "One AI signal founders should examine",
                "script": [
                    "Hook: A new AI announcement is not automatically a startup opportunity.",
                    f"Signal to examine: {lead['title']}.",
                    f"Show the source on screen: {lead['url']}.",
                    "Ask: Who has the urgent problem, who controls the budget, and what evidence would prove this thesis wrong?",
                    f"CTA: Follow AI Industry Alpha at {SITE_URL}.",
                ],
            },
            "xiaohongshu": {
                "title": "AI 创业机会，不能只看一条新闻",
                "text": (
                    f"本周值得进一步研究的一个 AI 信号：{lead['title']}\n\n"
                    f"原始来源：{lead['url']}\n\n"
                    "看到产品发布或融资消息，不等于已经验证了创业机会。更重要的是继续问：谁有迫切需求？谁有预算？什么证据会推翻这个判断？\n\n"
                    f"更多带来源的 AI 行业信号：{SITE_URL}\n\n"
                    "#AI创业 #人工智能 #创业观察"
                ),
            },
        },
    }


def generate_with_anthropic(markdown: str, date: str, links: list[dict[str, str]]) -> dict:
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")

    prompt = f"""You are the editorial marketing agent for AI Industry Alpha ({SITE_URL}), a source-linked AI industry intelligence publication for AI startup founders, CTOs, founding engineers, and technical investors.

Create a review-ready cross-platform social pack based ONLY on the weekly brief below. Return valid JSON only with keys: date, status, sources, drafts. drafts must contain linkedin {{title,text}}, x {{title,text}}, instagram {{title,caption,carousel}} where carousel is an array of 5-7 slide strings, tiktok {{title,script}} where script is an array of 4-7 short spoken/visual beats, and xiaohongshu {{title,text}}.

Rules:
- Keep source URLs intact; cite the strongest relevant source in each draft when possible.
- Never invent metrics, causal claims, customer demand, business relationships, or quotes.
- Distinguish observed facts from interpretation and hypotheses. A co-mention is not proof of a relationship.
- For startup opportunities, state what needs validation and one falsifier.
- LinkedIn: thoughtful professional analysis, useful opening hook, invite discussion; avoid generic hype.
- X: concise thread with 3 numbered posts; include source link and a non-pushy site CTA.
- Instagram: visual carousel, one idea per slide, legible short copy; caption with CTA.
- TikTok: 20-35 second script with hook, evidence, caveat, question, CTA. Do not imply a video was made.
- Xiaohongshu: natural Simplified Chinese, useful title, no exaggerated claims or clickbait; translate/adapt the insight, not just word-for-word.
- Add the site URL {SITE_URL} as a CTA, not in every sentence.
- Include a brief editorial note in JSON key "editorial_note" describing which claims need human verification.
- These are DRAFTS ONLY. No publishing.
- Make the platforms feel native; do not duplicate the same paragraph everywhere.

Date: {date}
Available source links (use only relevant ones): {json.dumps(links, ensure_ascii=False)}
Weekly brief:
---
{markdown[:18000]}
---
"""

    payload = {
        "model": "claude-3-7-sonnet-20250219",
        "max_tokens": 5000,
        "temperature": 0.3,
        "messages": [{"role": "user", "content": prompt}],
    }
    request = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        result = json.loads(response.read().decode("utf-8"))
    text = "".join(block.get("text", "") for block in result.get("content", []) if block.get("type") == "text")
    text = re.sub(r"^\s*```(?:json)?\s*|\s*```\s*$", "", text)
    pack = json.loads(text)
    pack.setdefault("date", date)
    pack.setdefault("status", "drafts_ready_for_human_review")
    pack.setdefault("sources", links)
    return pack


def to_markdown(pack: dict) -> str:
    drafts = pack.get("drafts", {})
    lines = [
        f"# AI Industry Alpha · Social Draft Pack · {pack.get('date', '')}",
        "",
        f"**Status:** {pack.get('status', 'review_required')}",
        "",
        "> Drafts only. Verify factual claims, links, platform formatting, and brand tone before publishing.",
        "",
    ]
    if pack.get("editorial_note"):
        lines += ["## Editorial review notes", "", str(pack["editorial_note"]), ""]
    for platform in PLATFORMS:
        draft = drafts.get(platform)
        if not isinstance(draft, dict):
            continue
        lines += [f"## {platform.replace('_', ' ').title()}", "", f"**{draft.get('title', 'Draft')}**", ""]
        if draft.get("text"):
            lines += [draft["text"], ""]
        if draft.get("caption"):
            lines += ["**Caption**", "", draft["caption"], ""]
        if draft.get("carousel"):
            lines += ["**Carousel outline**", ""]
            lines += [f"{i}. {slide}" for i, slide in enumerate(draft["carousel"], 1)]
            lines.append("")
        if draft.get("script"):
            lines += ["**Video script**", ""]
            lines += [f"{i}. {beat}" for i, beat in enumerate(draft["script"], 1)]
            lines.append("")
    if pack.get("sources"):
        lines += ["## Source links", ""]
        lines += [f"- [{s['title']}]({s['url']})" for s in pack["sources"] if s.get("title") and s.get("url")]
        lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--brief", required=True, help="Path to weekly insights Markdown")
    parser.add_argument("--out", default="marketing-drafts", help="Output directory")
    parser.add_argument("--date", default=dt.date.today().isoformat())
    args = parser.parse_args()

    brief_path = Path(args.brief)
    markdown = brief_path.read_text(encoding="utf-8")
    links = source_links(markdown)
    try:
        pack = generate_with_anthropic(markdown, args.date, links)
    except (RuntimeError, urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"LLM draft generation unavailable ({exc}); writing safe fallback drafts.")
        pack = fallback_pack(markdown, args.date)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / f"social-drafts-{args.date}.json"
    md_path = out_dir / f"social-drafts-{args.date}.md"
    json_path.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md_path.write_text(to_markdown(pack), encoding="utf-8")
    print(f"Wrote {md_path} and {json_path} ({pack.get('status', 'unknown')})")


if __name__ == "__main__":
    main()
