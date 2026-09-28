#!/usr/bin/env python3
"""Render the AI Infra Daily Digest as a magazine-style HTML page.

Editorial layout inspired by classic print weeklies: serif headlines,
generous whitespace, double rules, one restrained accent color.
Usage: python3 render_html.py [--days 1] [--out digests/]
"""
import argparse
import datetime as dt
import html as html_mod
import os
import sys

from digest_lib import collect

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SERIF = "Georgia,'Times New Roman',Times,serif"
SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
INK = "#1b1712"
MUTED = "#97907f"
FAINT = "#b3ab99"
ACCENT = "#b23a2e"
PAPER = "#fdfcf8"
PAGE_BG = "#efece3"
RULE = "#e3ddd0"


def esc(s: str) -> str:
    return html_mod.escape(s or "", quote=True)


def item_html(it: dict) -> str:
    ts = it["pub"].astimezone().strftime("%m-%d %H:%M")
    summary = ""
    if it["summary"]:
        summary = (
            f'<div style="font-family:{SERIF};font-size:14.5px;line-height:1.7;'
            f'color:#4c4536;margin:7px 0 0 0;">{esc(it["summary"])}</div>'
        )
    return (
        f'<div style="margin:0 0 24px 0;">'
        f'<a href="{esc(it["link"])}" style="font-family:{SERIF};font-size:19px;'
        f'line-height:1.4;color:{INK};text-decoration:none;">{esc(it["title"])}</a>'
        f'<div style="font-family:{SANS};font-size:11px;letter-spacing:1.5px;'
        f'text-transform:uppercase;color:{FAINT};margin:6px 0 0 0;">{esc(ts)}</div>'
        f'{summary}</div>'
    )


def section_html(src: dict) -> str:
    if src["error"]:
        body = (
            f'<div style="font-family:{SERIF};font-style:italic;font-size:14px;'
            f'color:{FAINT};">No updates today ({esc(src["error"])})</div>'
        )
    elif not src["items"]:
        body = (
            f'<div style="font-family:{SERIF};font-style:italic;font-size:14px;'
            f'color:{FAINT};">No updates in the lookback window.</div>'
        )
    else:
        body = "".join(item_html(it) for it in src["items"])
    return (
        f'<div style="padding:26px 44px 4px 44px;">'
        f'<div style="font-family:{SANS};font-size:11px;font-weight:700;'
        f'letter-spacing:3.5px;text-transform:uppercase;color:{ACCENT};">'
        f'{esc(src["name"])}</div>'
        f'<div style="border-top:1px solid {RULE};margin:10px 0 18px 0;"></div>'
        f'{body}</div>'
    )


def render(data: dict) -> str:
    date_label = dt.datetime.strptime(data["date"], "%Y-%m-%d").strftime("%A, %B %d, %Y")
    n = data["total"]
    count_label = f"{n} {'story' if n == 1 else 'stories'}"

    sections = "".join(section_html(src) for src in data["sources"])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Infra Daily Digest &middot; {esc(data["date"])}</title>
</head>
<body style="margin:0;padding:0;background:{PAGE_BG};">
<div style="background:{ACCENT};height:6px;font-size:0;line-height:0;">&nbsp;</div>
<div style="max-width:660px;margin:0 auto;background:{PAPER};">

  <div style="text-align:center;padding:38px 44px 26px 44px;">
    <div style="font-family:{SANS};font-size:11px;letter-spacing:5px;color:{MUTED};">THE DAILY DIGEST</div>
    <div style="font-family:{SERIF};font-size:46px;color:{INK};margin:12px 0 8px 0;letter-spacing:0.5px;">AI Infra</div>
    <div style="font-family:{SERIF};font-style:italic;font-size:14.5px;color:#6d6552;">{esc(date_label)} &nbsp;&middot;&nbsp; {esc(count_label)}</div>
  </div>
  <div style="border-top:1px solid {INK};margin:0 44px;"></div>
  <div style="border-top:3px solid {INK};margin:4px 44px 0 44px;"></div>

  {sections}

  <div style="margin:26px 44px 0 44px;border-top:1px solid {RULE};"></div>
  <div style="text-align:center;padding:24px 44px 40px 44px;">
    <div style="font-family:{SANS};font-size:10px;letter-spacing:3px;color:{MUTED};">AI INFRA DAILY DIGEST</div>
    <div style="font-family:{SERIF};font-style:italic;font-size:13px;color:{FAINT};margin-top:8px;">Curated from public RSS feeds &middot; {n} items</div>
  </div>

</div>
<div style="text-align:center;padding:18px 0 26px 0;font-family:{SANS};font-size:11px;color:{FAINT};letter-spacing:1px;">You receive this because you subscribed to the digest.</div>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=float, default=1.0)
    ap.add_argument("--out", default=os.path.join(BASE_DIR, "digests"))
    args = ap.parse_args()

    data = collect(args.days)
    page = render(data)

    os.makedirs(args.out, exist_ok=True)
    out_path = os.path.join(args.out, f"{data['date']}.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(page)
    print(f"Wrote {out_path} ({data['total']} items)")


if __name__ == "__main__":
    sys.exit(main())
