#!/usr/bin/env python3
"""Render the AI Infra Daily Digest as a modern tech-newsletter HTML page.

Design language inspired by the a16z newsletter: stark black-on-white,
heavy grotesque headlines, one signature red accent, a lead "Top Story"
hero, and tight sectioned lists. All styles are inline for email clients.
Usage: python3 render_html.py [--days 1] [--out digests/]
"""
import argparse
import datetime as dt
import html as html_mod
import json
import os
import sys

from digest_lib import collect

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SANS = "-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif"
INK = "#0a0a0a"
GRAY = "#6e6e6e"
LIGHT = "#9a9a9a"
BORDER = "#e9e9e9"
RED = "#e5322d"


def esc(s: str) -> str:
    return html_mod.escape(s or "", quote=True)


def item_html(it: dict) -> str:
    ts = it["pub"].astimezone().strftime("%m-%d %H:%M")
    summary = ""
    if it["summary"]:
        summary = (
            f'<div style="font-family:{SANS};font-size:14px;line-height:1.65;'
            f'color:#454545;margin:7px 0 0 0;">{esc(it["summary"])}</div>'
        )
    read_more = ""
    if it["link"]:
        read_more = (
            f'<div style="margin-top:9px;">'
            f'<a href="{esc(it["link"])}" style="font-family:{SANS};font-size:13px;'
            f'font-weight:700;color:{RED};text-decoration:none;">'
            f'Read the full story &rarr;</a></div>'
        )
    return (
        f'<div style="padding:16px 0;border-bottom:1px solid {BORDER};">'
        f'<a href="{esc(it["link"])}" style="font-family:{SANS};font-size:17px;'
        f'font-weight:700;line-height:1.45;color:{INK};text-decoration:none;">'
        f'{esc(it["title"])}</a>'
        f'<div style="font-family:{SANS};font-size:12px;font-weight:500;'
        f'color:{LIGHT};margin-top:6px;letter-spacing:0.3px;">{esc(ts)}</div>'
        f'{summary}{read_more}</div>'
    )


def hero_html(it: dict, source_name: str) -> str:
    ts = it["pub"].astimezone().strftime("%m-%d %H:%M")
    summary = ""
    if it["summary"]:
        summary = (
            f'<div style="font-family:{SANS};font-size:15px;line-height:1.7;'
            f'color:#333333;margin:12px 0 0 0;">{esc(it["summary"])}</div>'
        )
    read_more = ""
    if it["link"]:
        read_more = (
            f'<div style="margin-top:14px;">'
            f'<a href="{esc(it["link"])}" style="font-family:{SANS};font-size:14px;'
            f'font-weight:700;color:{RED};text-decoration:none;">'
            f'Read the full story &rarr;</a></div>'
        )
    return (
        f'<div style="padding:26px 28px 8px 28px;">'
        f'<div style="margin-bottom:14px;">'
        f'<span style="background:{RED};color:#ffffff;font-family:{SANS};'
        f'font-size:11px;font-weight:700;letter-spacing:2.5px;'
        f'padding:6px 12px;">TOP STORY</span></div>'
        f'<a href="{esc(it["link"])}" style="font-family:{SANS};font-size:27px;'
        f'font-weight:800;line-height:1.25;letter-spacing:-0.5px;'
        f'color:{INK};text-decoration:none;">{esc(it["title"])}</a>'
        f'<div style="font-family:{SANS};font-size:12px;font-weight:600;'
        f'color:{GRAY};margin-top:10px;letter-spacing:1.5px;">'
        f'{esc(source_name.upper())} &nbsp;&middot;&nbsp; {esc(ts)}</div>'
        f'{summary}{read_more}</div>'
    )


def section_html(src: dict, skip_ids: set) -> str:
    items = [it for it in src["items"] if id(it) not in skip_ids]
    if src["error"]:
        body = (
            f'<div style="font-family:{SANS};font-size:13px;font-style:italic;'
            f'color:{LIGHT};padding:14px 0;">No updates today ({esc(src["error"])})</div>'
        )
    elif not items:
        body = (
            f'<div style="font-family:{SANS};font-size:13px;font-style:italic;'
            f'color:{LIGHT};padding:14px 0;">No updates in the lookback window.</div>'
        )
    else:
        body = "".join(item_html(it) for it in items)
    return (
        f'<div style="padding:24px 28px 0 28px;">'
        f'<div style="display:inline-block;font-family:{SANS};font-size:13px;'
        f'font-weight:800;letter-spacing:2px;color:{INK};'
        f'border-bottom:3px solid {RED};padding-bottom:7px;">'
        f'{esc(src["name"].upper())}</div>'
        f'{body}</div>'
    )


def pulse_html(pulse: dict | None) -> str:
    """Compact 'This week's pulse' block for the daily digest header."""
    if not pulse or (not pulse.get("trending") and not pulse.get("bottlenecks")):
        return ""
    bits = []
    for t in pulse.get("trending", [])[:4]:
        v = t["velocity"]
        arrow = "&#9650;" if v >= 1.5 else ("&#9660;" if v <= 0.67 else "&#8212;")
        color = RED if v >= 1.5 else ("#9a9a9a" if v <= 0.67 else "#555555")
        bits.append(
            f'<span style="color:{color};font-weight:700;">{arrow}</span> '
            f'{esc(t["topic"])}')
    trend_line = " &nbsp;&middot;&nbsp; ".join(bits)
    pains = "".join(
        f'<div style="margin-top:4px;">{esc(b["topic"])} '
        f'<span style="color:{LIGHT};">({b["count"]})</span></div>'
        for b in pulse.get("bottlenecks", [])[:3])
    pains_block = (f'<div style="margin-top:8px;"><span style="font-weight:700;">'
                   f'Pain signals:</span>{pains}</div>' if pains else "")
    return (
        f'<div style="margin:0 28px 4px 28px;border:1px solid {BORDER};'
        f'background:#fafafa;padding:14px 16px;">'
        f'<div style="font-family:{SANS};font-size:11px;font-weight:700;'
        f'letter-spacing:2px;color:{RED};">THIS WEEK&apos;S PULSE</div>'
        f'<div style="font-family:{SANS};font-size:13px;line-height:1.8;'
        f'color:#333333;margin-top:8px;">{trend_line}{pains_block}</div>'
        f'</div>')


def render(data: dict, pulse: dict | None = None) -> str:
    date_label = dt.datetime.strptime(data["date"], "%Y-%m-%d").strftime("%B %d, %Y")
    n = data["total"]
    count_label = f"{n} {'STORY' if n == 1 else 'STORIES'}"

    # Lead story: the single most recent item across all sources.
    all_items = [(it, src["name"]) for src in data["sources"] for it in src["items"]]
    all_items.sort(key=lambda pair: pair[0]["pub"], reverse=True)
    hero = ""
    skip_ids = set()
    if all_items:
        top, top_source = all_items[0]
        hero = hero_html(top, top_source)
        skip_ids.add(id(top))

    sections = "".join(section_html(src, skip_ids) for src in data["sources"])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Infra Daily Digest &middot; {esc(data["date"])}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;">
<div style="max-width:640px;margin:0 auto;background:#ffffff;">
  <div style="background:{RED};height:5px;font-size:0;line-height:0;">&nbsp;</div>

  <div style="padding:30px 28px 22px 28px;">
    <div style="font-family:{SANS};font-size:32px;font-weight:800;letter-spacing:-1px;color:{INK};line-height:1;">AI INFRA</div>
    <div style="font-family:{SANS};font-size:11px;font-weight:600;letter-spacing:3px;color:{GRAY};margin-top:10px;">DAILY DIGEST &nbsp;&middot;&nbsp; {esc(date_label).upper()} &nbsp;&middot;&nbsp; {esc(count_label)}</div>
  </div>
  <div style="border-top:2px solid {INK};margin:0 28px;"></div>

  {pulse_html(pulse)}
  {hero}
  {sections}

  <div style="margin:30px 28px 0 28px;border-top:2px solid {INK};"></div>
  <div style="text-align:center;padding:26px 28px 36px 28px;">
    <div style="font-family:{SANS};font-size:15px;font-weight:800;letter-spacing:-0.5px;color:{INK};">AI INFRA</div>
    <div style="font-family:{SANS};font-size:12px;color:{LIGHT};margin-top:8px;">Curated from public RSS feeds &middot; {n} items</div>
    <div style="font-family:{SANS};font-size:11px;color:{LIGHT};margin-top:10px;">To unsubscribe, open an issue titled &ldquo;Unsubscribe&rdquo; at <a href="https://github.com/janehwzn/ai-infra-digest/issues" style="color:{GRAY};text-decoration:underline;">github.com/janehwzn/ai-infra-digest</a></div>
  </div>

</div>
<div style="text-align:center;padding:16px 0 24px 0;font-family:{SANS};font-size:11px;color:{LIGHT};">You receive this because you subscribed to the digest.</div>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=float, default=1.0)
    ap.add_argument("--out", default=os.path.join(BASE_DIR, "digests"))
    ap.add_argument("--pulse", default=None,
                    help="JSON file from insights.py --daily, injected as a pulse block")
    args = ap.parse_args()

    data = collect(args.days)
    pulse = None
    if args.pulse and os.path.exists(args.pulse):
        with open(args.pulse, encoding="utf-8") as f:
            pulse = json.load(f)
    page = render(data, pulse)

    os.makedirs(args.out, exist_ok=True)
    out_path = os.path.join(args.out, f"{data['date']}.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(page)
    print(f"Wrote {out_path} ({data['total']} items)")


if __name__ == "__main__":
    sys.exit(main())
