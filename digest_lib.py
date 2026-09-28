"""Shared logic for the AI Infra Daily Digest: feed fetching and collection."""

import datetime as dt
import html
import re
import time

import feedparser

FEEDS = [
    ("SemiAnalysis", "https://semianalysis.com/feed/"),
    ("Latent Space", "https://www.latent.space/feed"),
    ("Import AI", "https://importai.substack.com/feed"),
    ("TLDR AI", "https://tldr.tech/api/rss/ai"),
    ("Anyscale Blog", "https://www.anyscale.com/rss.xml"),
    ("Modal Blog", "https://modal.com/blog/atom.xml"),
    ("vLLM Releases", "https://github.com/vllm-project/vllm/releases.atom"),
    ("SGLang Releases", "https://github.com/sgl-project/sglang/releases.atom"),
]

MAX_PER_SOURCE = 6
SUMMARY_LEN = 280


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


def fetch_source(name: str, url: str, since: dt.datetime):
    """Fetch one feed. Returns (items, error)."""
    try:
        fp = feedparser.parse(url, agent="Mozilla/5.0 (ai-infra-digest)")
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
        items.append({
            "title": title,
            "link": link,
            "summary": summary,
            "pub": pub,
        })
    items.sort(key=lambda x: x["pub"], reverse=True)
    return items[:MAX_PER_SOURCE], None


def collect(days: float) -> dict:
    """Collect all sources. Returns structured digest data."""
    now_utc = dt.datetime.now(dt.timezone.utc)
    since = now_utc - dt.timedelta(days=days)
    today = dt.datetime.now().strftime("%Y-%m-%d")
    sources = []
    total = 0
    for name, url in FEEDS:
        items, err = fetch_source(name, url, since)
        total += len(items)
        sources.append({"name": name, "items": items, "error": err})
    return {"date": today, "days": days, "sources": sources, "total": total}
