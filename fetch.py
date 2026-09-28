#!/usr/bin/env python3
"""AI infra 每日速览 - RSS 聚合器.

从 curated 的 RSS 源抓取最近 N 天的内容,按来源分组生成 Markdown digest。
用法: python3 fetch.py [--days 1] [--out digests/]
"""
import argparse
import datetime as dt
import html
import os
import re
import sys
import time

import feedparser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

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
    try:
        fp = feedparser.parse(url, agent="Mozilla/5.0 (ai-infra-digest)")
    except Exception as ex:
        return [], f"抓取失败: {ex}"
    if fp.bozo and not fp.entries:
        return [], "解析失败或为空"
    items = []
    for e in fp.entries:
        pub = entry_time(e)
        if pub is None or pub < since:
            continue
        title = clean_text(e.get("title", "(无标题)"))
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=float, default=1.0)
    ap.add_argument("--out", default=os.path.join(BASE_DIR, "digests"))
    args = ap.parse_args()

    now_utc = dt.datetime.now(dt.timezone.utc)
    since = now_utc - dt.timedelta(days=args.days)
    today = dt.datetime.now().strftime("%Y-%m-%d")

    lines = [f"# AI Infra 每日速览 · {today}", ""]
    total = 0
    for name, url in FEEDS:
        items, err = fetch_source(name, url, since)
        lines.append(f"## {name}")
        if err:
            lines.append(f"_今日无更新（{err}）_")
        elif not items:
            lines.append("_过去 24 小时无更新_")
        else:
            for it in items:
                total += 1
                ts = it["pub"].astimezone().strftime("%m-%d %H:%M")
                lines.append(f"- [{it['title']}]({it['link']}) `{ts}`")
                if it["summary"]:
                    lines.append(f"  {it['summary']}")
        lines.append("")
    lines.append(f"_共 {total} 条 · 数据来源为各公开 RSS_")

    os.makedirs(args.out, exist_ok=True)
    out_path = os.path.join(args.out, f"{today}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Wrote {out_path} ({total} items)")
    print("\n".join(lines))


if __name__ == "__main__":
    sys.exit(main())
