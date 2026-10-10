"""Shared logic for AI Industry Alpha: feed fetching and collection."""

import datetime as dt
import html
import json
import os
import re
import time

import feedparser

FEEDS = [
    # (name, url, section, funding_only)
    ("SemiAnalysis", "https://semianalysis.com/feed/", "AI Infra", False),
    ("Latent Space", "https://www.latent.space/feed", "AI Infra", False),
    ("Import AI", "https://importai.substack.com/feed", "AI Infra", False),
    ("TLDR AI", "https://tldr.tech/api/rss/ai", "AI Infra", False),
    ("Anyscale Blog", "https://www.anyscale.com/rss.xml", "AI Infra", False),
    ("Modal Blog", "https://modal.com/blog/atom.xml", "AI Infra", False),
    ("vLLM Releases", "https://github.com/vllm-project/vllm/releases.atom", "AI Infra", False),
    ("SGLang Releases", "https://github.com/sgl-project/sglang/releases.atom", "AI Infra", False),
    # AI Voices — what the key people / labs publish themselves
    ("Sam Altman", "https://blog.samaltman.com/posts.atom", "AI Voices", False),
    ("OpenAI News", "https://openai.com/news/rss.xml", "AI Voices", False),
    ("Karpathy", "https://karpathy.github.io/feed.xml", "AI Voices", False),
    # Bay Area startup news
    ("Hacker News", "https://news.ycombinator.com/rss", "Funding & Startups", True),
    ("TechCrunch Startups", "https://techcrunch.com/category/startups/feed/",
     "Funding & Startups", True),
    ("TechCrunch Venture", "https://techcrunch.com/category/venture/feed/",
     "Funding & Startups", True),
    ("YC Blog", "https://www.ycombinator.com/blog/rss", "Funding & Startups", False),
    ("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/",
     "Funding & Startups", True),
    ("SiliconANGLE", "https://siliconangle.com/feed/", "Funding & Startups", True),
    ("GeekWire", "https://www.geekwire.com/feed/", "Funding & Startups", True),
]

# Keywords that mark an item as funding / new-startup news.
# Applied only to feeds flagged funding_only, so general tech news
# from those feeds doesn't flood the digest.
FUNDING_KEYWORDS = [
    "rais", "funding", "funded", "financ", "seed", "series",
    "valuation", "ipo", "acqui", "merger", "unicorn", "backed",
    "round", "stealth", "debut", "startup", "launch",
]


def is_funding_news(title: str, summary: str) -> bool:
    text = f"{title} {summary}".lower()
    return any(k in text for k in FUNDING_KEYWORDS)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARCHIVE_FILE = os.path.join(BASE_DIR, "data", "archive.jsonl")

MAX_PER_SOURCE = 6
SUMMARY_LEN = 280


def append_archive(data: dict) -> int:
    """Append digest items to the persistent archive (deduped by link).

    Returns the number of newly added items.
    """
    os.makedirs(os.path.dirname(ARCHIVE_FILE), exist_ok=True)
    seen: set[str] = set()
    if os.path.exists(ARCHIVE_FILE):
        with open(ARCHIVE_FILE, encoding="utf-8") as f:
            for line in f:
                try:
                    seen.add(json.loads(line).get("link"))
                except Exception:
                    pass
    added = 0
    with open(ARCHIVE_FILE, "a", encoding="utf-8") as f:
        for src in data["sources"]:
            for it in src["items"]:
                if not it["link"] or it["link"] in seen:
                    continue
                seen.add(it["link"])
                f.write(json.dumps({
                    "date": data["date"],
                    "source": src["name"],
                    "title": it["title"],
                    "link": it["link"],
                    "summary": it["summary"],
                    "pub": it["pub"].isoformat(),
                }, ensure_ascii=False) + "\n")
                added += 1
    return added


def load_archive() -> list[dict]:
    """Load archived items, parsing pub back to datetime."""
    items: list[dict] = []
    if not os.path.exists(ARCHIVE_FILE):
        return items
    with open(ARCHIVE_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                e = json.loads(line)
                e["pub"] = dt.datetime.fromisoformat(e["pub"])
                e["text"] = f"{e.get('title', '')} {e.get('summary', '')}".lower()
                items.append(e)
            except Exception:
                pass
    return items


def clean_text(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def entry_time(e) -> dt.datetime | None:
    for key in ("published_parsed", "updated_parsed"):
        t = e.get(key)
        if t:
            try:
                return dt.datetime.fromtimestamp(time.mktime(t), tz=dt.timezone.utc)
            except Exception:
                pass
    return None


def fetch_source(name: str, url: str, since: dt.datetime, funding_only: bool = False):
    """Fetch one feed. Returns (items, error)."""
    try:
        fp = feedparser.parse(url, agent="Mozilla/5.0 (ai-industry-alpha)")
    except Exception as ex:
        return [], f"fetch failed: {ex}"
    if fp.bozo and not fp.entries:
        return [], "parse failed or empty"
    items = []
    for e in fp.entries:
        pub = entry_time(e)
        if pub is None or pub < since:
            continue
        title = clean_text(e.get("title", "(untitled)"))
        link = e.get("link", "")
        summary = clean_text(e.get("summary", "") or e.get("description", ""))
        if len(summary) > SUMMARY_LEN:
            summary = summary[:SUMMARY_LEN].rstrip() + "…"
        if funding_only and not is_funding_news(title, summary):
            continue
        items.append({
            "title": title,
            "link": link,
            "summary": summary,
            "pub": pub,
        })
    items.sort(key=lambda x: x["pub"], reverse=True)
    return items[:MAX_PER_SOURCE], None


def source_coverage(data: dict) -> tuple[int, int]:
    """(active_sources, total_sources).

    A source counts as active when it yielded at least one item in the
    lookback window. Sources that errored or came back empty count as stale.
    """
    sources = data.get("sources", [])
    active = sum(1 for s in sources if s.get("items"))
    return active, len(sources)


def paraphrase_summaries(items: list[dict]) -> None:
    """Rewrite RSS summaries in original wording (copyright hygiene).

    RSS descriptions are often the publisher's own prose copied verbatim;
    republishing them at scale inside a paid product weakens fair use.
    This rewrites each summary with fresh sentence structure while keeping
    every fact identical — paraphrase, not distortion.

    Mutates items in place. Uses ANTHROPIC_API_KEY when set; on ANY
    failure (no key, API error, timeout, bad response) leaves summaries
    untouched so the daily digest never breaks.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    targets = [it for it in items
               if it.get("summary") and len(it["summary"]) > 80]
    if not api_key or not targets:
        return
    try:
        numbered = "\n\n".join(
            f"[{i}] TITLE: {it['title']}\nSUMMARY: {it['summary']}"
            for i, it in enumerate(targets)
        )
        prompt = (
            "Rewrite each SUMMARY below in completely original wording "
            "(1-2 sentences, English, neutral informative tone) so it does "
            "not copy the publisher's phrasing. STRICT: preserve every fact "
            "exactly (names, numbers, amounts, dates, companies, the core "
            "claim); do not add facts; do not change, soften, or hype the "
            "meaning; never invent quotes. If a summary is already a short "
            "factual fragment, return it nearly unchanged. Reply with ONLY "
            "a JSON array of strings, one rewritten summary per item, in "
            "order, no other text.\n\n" + numbered
        )
        body = json.dumps({
            "model": os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5"),
            "max_tokens": 4000,
            "messages": [{"role": "user", "content": prompt}],
        }).encode()
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages", data=body, method="POST",
            headers={"x-api-key": api_key,
                     "anthropic-version": "2023-06-01",
                     "content-type": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r:
            resp = json.load(r)
        text = "".join(
            b.get("text", "") for b in resp.get("content", [])
            if b.get("type") == "text").strip()
        # strip possible code fences
        if text.startswith("```"):
            text = re.sub(r"^```\w*\n?", "", text)
            text = re.sub(r"\n?```$", "", text)
        rewritten = json.loads(text)
        if (isinstance(rewritten, list)
                and len(rewritten) == len(targets)
                and all(isinstance(s, str) and s.strip()
                        for s in rewritten)):
            for it, new in zip(targets, rewritten):
                it["summary"] = new.strip()
    except Exception:
        pass


def collect(days: float) -> dict:
    """Collect all sources. Returns structured digest data."""
    now_utc = dt.datetime.now(dt.timezone.utc)
    since = now_utc - dt.timedelta(days=days)
    today = dt.datetime.now().strftime("%Y-%m-%d")
    sources = []
    total = 0
    for name, url, section, funding_only in FEEDS:
        items, err = fetch_source(name, url, since, funding_only)
        total += len(items)
        sources.append({"name": name, "section": section,
                        "items": items, "error": err})
    # rewrite summaries in our own words before anything is archived
    all_items = [it for s in sources for it in s["items"]]
    paraphrase_summaries(all_items)
    return {"date": today, "days": days, "sources": sources, "total": total}
