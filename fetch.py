#!/usr/bin/env python3
"""AI Industry Alpha - RSS aggregator (Markdown output).

Fetches the last N days of content from a curated list of RSS feeds and
generates a Markdown digest grouped by source.
Usage: python3 fetch.py [--days 1] [--out digests/]
"""
import argparse
import json
import os
import sys

from digest_lib import append_archive, collect, source_coverage

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def render_markdown(data: dict) -> str:
    lines = [f"# AI Industry Alpha · {data['date']}", ""]
    last_section = None
    for src in data["sources"]:
        section = src.get("section") or "AI Infra"
        if section != last_section:
            lines.append(f"## {section.upper()}")
            lines.append("")
            last_section = section
        lines.append(f"### {src['name']}")
        if src["error"]:
            lines.append(f"_No updates today ({src['error']})_")
        elif not src["items"]:
            lines.append("_No updates in the lookback window_")
        else:
            for it in src["items"]:
                ts = it["pub"].astimezone().strftime("%m-%d %H:%M")
                lines.append(f"- [{it['title']}]({it['link']}) `{ts}`")
                if it["summary"]:
                    lines.append(f"  {it['summary']}")
        lines.append("")
    lines.append(f"_{data['total']} items · Sources: public RSS feeds_")
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=float, default=1.0)
    ap.add_argument("--out", default=os.path.join(BASE_DIR, "digests"))
    args = ap.parse_args()

    data = collect(args.days)
    text = render_markdown(data)

    os.makedirs(args.out, exist_ok=True)
    out_path = os.path.join(args.out, f"{data['date']}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"Wrote {out_path} ({data['total']} items)")

    # Coverage sidecar: lets send_email.py skip quiet days without
    # re-fetching. Archiving still happens below regardless.
    active, total = source_coverage(data)
    meta = {
        "date": data["date"],
        "days": data["days"],
        "active_sources": active,
        "total_sources": total,
        "total_items": data["total"],
    }
    meta_path = os.path.join(args.out, f"{data['date']}.meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f)
    print(f"Wrote {meta_path} ({active}/{total} sources active)")

    n = append_archive(data)
    print(f"Archived {n} new items")
    print(text)


if __name__ == "__main__":
    sys.exit(main())
