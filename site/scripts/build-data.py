#!/usr/bin/env python3
"""Build the site's JSON data from the digest pipeline outputs.

Reads:
  - website-seed.json          (seed headlines + weekly theses)
  - data/archive.jsonl         (daily digest archive, appended by digest.yml)

Writes:
  - site/public/data/headlines.json
  - site/public/data/theses.json
  - site/public/data/meta.json

Headlines are deduped by link and sorted newest-first. Theses are the
premium "Signal Ledger" content.
"""
import datetime as dt
import json
import os
import re
import sys

SITE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_DIR = os.path.dirname(SITE_DIR)
OUT_DIR = os.path.join(SITE_DIR, "public", "data")


def slugify(s: str) -> str:
    s = (s or "").lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60] or "item"


# Content taxonomy for the homepage category sections, in priority order
# (ties break toward the earlier category). Keywords match against the
# lowercased title + summary.
CATEGORIES: list[tuple[str, list[str]]] = [
    ("Funding & Startups", [
        "funding", "raises", "raised", "series a", "series b", "series c",
        "series d", "seed round", "seed funding", "valuation", "unicorn",
        "ipo", "venture capital", "vc firm", "led the round", "led by",
        "million in funding", "billion in funding",
    ]),
    ("Models & Research", [
        "model", "llm", "gpt-", "gpt–", "claude", "gemini", "llama",
        "mistral", "benchmark", "frontier model", "reasoning model",
        "open weights", "training run", "foundation model", "diffusion",
    ]),
    ("Compute & Chips", [
        "gpu", "chip", "nvidia", "amd", "tsmc", "data center", "datacenter",
        "compute", "inference", "tpu", "semiconductor", "power grid",
        "stargate",
    ]),
    ("AI Agents", [
        "agent", "agentic", "copilot", "workflow automation", "ai employee",
        "autonomous",
    ]),
    ("Enterprise", [
        "enterprise", "fortune 500", "cio", "adopts", "deployment",
        "partnership", "b2b",
    ]),
    ("Big Tech", [
        "microsoft", "google", "meta", "amazon", "apple", "openai",
        "anthropic", "xai", "deepmind", "alphabet", "tesla", "oracle",
        "satya nadella",
    ]),
    ("People", [
        "hires", "ceo", "founder", "executive", "appoints", "departs",
        "resignation", "joins as", "named ceo", "co-founder",
    ]),
    ("Policy & Safety", [
        "regulation", "policy", "safety", "copyright", "lawsuit", "ai act",
        "congress", "white house", "antitrust", "ban",
    ]),
    ("Open Source", [
        "open source", "open-source", "oss", "github",
    ]),
]
FALLBACK_CATEGORY = "More in AI"


def classify(title: str, summary: str) -> tuple[str, str]:
    text = f"{title or ''} {summary or ''}".lower()
    best_name = FALLBACK_CATEGORY
    best_score = 0
    for name, keywords in CATEGORIES:
        score = sum(1 for kw in keywords if kw in text)
        if score > best_score:
            best_score = score
            best_name = name
    return best_name, slugify(best_name)


def parse_ts(value) -> dt.datetime:
    if isinstance(value, dt.datetime):
        d = value
    else:
        try:
            d = dt.datetime.fromisoformat(str(value))
        except Exception:
            d = dt.datetime(2000, 1, 1)
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc)


def load_items() -> list[dict]:
    items: list[dict] = []
    seed_path = os.path.join(REPO_DIR, "website-seed.json")
    if os.path.exists(seed_path):
        with open(seed_path, encoding="utf-8") as f:
            seed = json.load(f)
        for it in seed.get("items", []):
            items.append({
                "date": it.get("date", ""),
                "source": it.get("source", ""),
                "title": it.get("title", ""),
                "link": it.get("link", ""),
                "summary": it.get("summary", ""),
                "pub": it.get("pub", ""),
            })
    archive_path = os.path.join(REPO_DIR, "data", "archive.jsonl")
    if os.path.exists(archive_path):
        with open(archive_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    e = json.loads(line)
                    items.append({
                        "date": e.get("date", ""),
                        "source": e.get("source", ""),
                        "title": e.get("title", ""),
                        "link": e.get("link", ""),
                        "summary": e.get("summary", ""),
                        "pub": e.get("pub", ""),
                    })
                except Exception:
                    pass
    # dedupe by link (keep newest), drop empties
    by_link: dict[str, dict] = {}
    for it in items:
        if not it["title"] or not it["link"]:
            continue
        it["_ts"] = parse_ts(it["pub"] or it["date"])
        prev = by_link.get(it["link"])
        if prev is None or it["_ts"] > prev["_ts"]:
            by_link[it["link"]] = it
    deduped = sorted(by_link.values(), key=lambda x: x["_ts"], reverse=True)
    used: dict[str, int] = {}
    out = []
    for it in deduped:
        base = slugify(it["title"])
        n = used.get(base, 0)
        used[base] = n + 1
        cat_name, cat_slug = classify(it["title"], it["summary"])
        out.append({
            "id": base if n == 0 else f"{base}-{n}",
            "date": it["date"],
            "source": it["source"],
            "title": it["title"],
            "link": it["link"],
            "summary": it["summary"],
            "pub": it["_ts"].isoformat(),
            "premium": False,
            "category": cat_name,
            "category_slug": cat_slug,
        })
    return out


def load_theses() -> list[dict]:
    theses: list[dict] = []
    seed_path = os.path.join(REPO_DIR, "website-seed.json")
    if os.path.exists(seed_path):
        with open(seed_path, encoding="utf-8") as f:
            seed = json.load(f)
        for i, th in enumerate(seed.get("theses", [])):
            ev = th.get("evidence", [])
            if isinstance(ev, str):
                ev = [ev]
            theses.append({
                "id": f"thesis-{i + 1}",
                "thesis": th.get("thesis", ""),
                "why_now": th.get("why_now", ""),
                "evidence": ev,
                "angle": th.get("angle", ""),
                "week": seed.get("generated", ""),
                "premium": True,
                "sample": bool(th.get("sample", False)),
            })
    return theses


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    headlines = load_items()
    theses = load_theses()
    with open(os.path.join(OUT_DIR, "headlines.json"), "w", encoding="utf-8") as f:
        json.dump(headlines, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT_DIR, "theses.json"), "w", encoding="utf-8") as f:
        json.dump(theses, f, ensure_ascii=False, indent=1)
    sources = sorted({h["source"] for h in headlines if h["source"]})
    cat_counts: dict[str, int] = {}
    cat_names: dict[str, str] = {}
    for h in headlines:
        slug = h.get("category_slug") or slugify(FALLBACK_CATEGORY)
        cat_counts[slug] = cat_counts.get(slug, 0) + 1
        cat_names[slug] = h.get("category") or FALLBACK_CATEGORY
    # Order categories by story count (most active first); ties follow the
    # taxonomy priority defined in CATEGORIES.
    priority = [slugify(name) for name, _ in CATEGORIES] + [slugify(FALLBACK_CATEGORY)]
    categories = [
        {"name": cat_names[slug], "slug": slug, "count": cat_counts[slug]}
        for slug in sorted(cat_counts, key=lambda s: (-cat_counts[s], priority.index(s) if s in priority else 99))
    ]
    meta = {
        "generated": dt.datetime.now(dt.timezone.utc).isoformat(),
        "headline_count": len(headlines),
        "thesis_count": len(theses),
        "sources": sources,
        "categories": categories,
    }
    with open(os.path.join(OUT_DIR, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print(f"wrote {len(headlines)} headlines, {len(theses)} theses -> {OUT_DIR}")


if __name__ == "__main__":
    sys.exit(main())
