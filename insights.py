#!/usr/bin/env python3
"""Insight layer for the AI Infra Daily Digest.

Derives structured signals from the archived digest items (data/archive.jsonl):

  1. Trend momentum   - which topics are heating up / cooling down
  2. Bottleneck radar - pain points the ecosystem keeps hitting
  3. Dots connected   - startup theses (LLM when ANTHROPIC_API_KEY is set,
                        auto-detected intersections otherwise)
  4. People moves     - hiring / founding / leaving signals (unverified)

Modes:
  --daily --out pulse.json    compact pulse for the daily digest header
  --weekly --out dir/         full Weekly Insights edition (md + html)

Set ANTHROPIC_API_KEY as an env var / repo secret to enable LLM theses.
Everything else is pure Python and works without any key.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.request
from collections import Counter, defaultdict
from itertools import combinations

from digest_lib import load_archive

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- topics

TOPICS = {
    "Inference serving": ["inference", "serving", "vllm", "sglang", "tensorrt",
                          "tgi", "llm serving", "text generation"],
    "KV cache & memory": ["kv cache", "kv-cache", "pagedattention", "prefix cach"],
    "Quantization": ["quantiz", "int8", "int4", "fp8", "awq", "gptq"],
    "GPU scheduling": ["gpu schedul", "schedul", "orchestrat", "autoscal",
                       "binpack", "bin-pack", "multi-gpu", "gang schedul"],
    "Agents & sandboxing": ["agent", "sandbox"],
    "LLM gateway": ["gateway", "api gateway", "rout", "load balanc", "rate limit"],
    "Cost optimization": ["cost", "pricing", "cheaper", "spot instance",
                          "cost-per", "$/"],
    "Data centers": ["data center", "datacenter", "power", "cooling",
                     "bare metal"],
    "Hardware": ["nvidia", "h100", "h200", "b200", "tpu", "asic", "gpu"],
    "Model releases": ["release", "open weights", "checkpoint", "new model"],
    "Observability": ["observability", "trac", "opentelemetry", "monitor"],
    "Fine-tuning & training": ["fine-tun", "finetun", "training", "pretrain"],
}

PAIN_PATTERNS = [
    r"\bbottleneck", r"\btoo slow\b", r"\bslower\b", r"\bslowest\b",
    r"\bexpensive\b", r"\bcostly\b", r"\blimitation", r"\bstruggl",
    r"\bfail", r"\blacks?\b", r"\bshortage", r"\bunsolved\b",
    r"\bhard problem", r"\bpain", r"\boverhead", r"\bwast",
    r"\bcan'?t\b", r"\bcannot\b", r"\bunable\b", r"\bstill no\b",
    r"\bnot enough\b", r"\bchoke", r"\bmeltdown\b",
]
PAIN_RES = [re.compile(p, re.I) for p in PAIN_PATTERNS]

MOVE_KEYWORDS = ["joins", "joined", "leaving", "founded by", "founder",
                 "launches", "hired", "appointed", "formerly at", "starts at",
                 "left to", "joins as"]


def topic_hits(text: str) -> list[str]:
    return [name for name, kws in TOPICS.items()
            if any(k in text for k in kws)]


def recent(items: list[dict], days: float) -> list[dict]:
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)
    return [it for it in items if it["pub"] >= cutoff]


# ------------------------------------------------------- 1. trends

def week_windows(n: int = 6, days: int = 7):
    """Rolling windows: index 0 is the most recent `days` days."""
    now = dt.datetime.now(dt.timezone.utc)
    return [(now - dt.timedelta(days=(i + 1) * days),
             now - dt.timedelta(days=i * days)) for i in range(n)]


def compute_trends(items: list[dict], n: int = 6):
    wins = week_windows(n)
    counts = {t: [0] * n for t in TOPICS}
    for it in items:
        pub = it["pub"]
        for i, (start, end) in enumerate(wins):
            if start <= pub < end:
                for t in topic_hits(it["text"]):
                    counts[t][i] += 1
                break
    out = []
    for topic, cs in counts.items():
        total = sum(cs)
        if total < 2:
            continue
        base = sum(cs[1:5]) / 4 if n >= 5 else sum(cs[1:]) / max(len(cs[1:]), 1)
        velocity = cs[0] / (base + 0.5)
        out.append({"topic": topic, "counts": cs, "total": total,
                    "current": cs[0], "velocity": round(velocity, 2)})
    out.sort(key=lambda r: r["velocity"], reverse=True)
    labels = [f"{(wins[i][0] + dt.timedelta(days=6)).strftime('%m/%d')}"
              for i in range(n)]
    return out, labels


# ------------------------------------------------------- 2. bottlenecks

def compute_bottlenecks(items: list[dict], days: int = 14, limit: int = 5):
    buckets: dict[str, list[dict]] = defaultdict(list)
    for it in recent(items, days):
        if not any(p.search(it["text"]) for p in PAIN_RES):
            continue
        for t in topic_hits(it["text"])[:2] or ["General"]:
            buckets[t].append(it)
    ranked = sorted(buckets.items(), key=lambda kv: len(kv[1]),
                    reverse=True)[:limit]
    return [{"topic": t, "count": len(v),
             "evidence": [{"title": e["title"], "link": e["link"],
                           "source": e["source"]} for e in v[:2]]}
            for t, v in ranked]


# ------------------------------------------------------- 3. dots

def compute_intersections(items: list[dict], days: int = 14, limit: int = 3):
    pair_hits: dict[tuple, list[dict]] = defaultdict(list)
    for it in recent(items, days):
        ts = sorted(set(topic_hits(it["text"])))
        for a, b in combinations(ts, 2):
            if len(pair_hits[(a, b)]) < 3:
                pair_hits[(a, b)].append(it)
    scored = []
    for (a, b), ev in pair_hits.items():
        sources = {e["source"] for e in ev}
        if len(sources) >= 2:
            scored.append({"a": a, "b": b, "sources": sorted(sources),
                           "evidence": [{"title": e["title"], "link": e["link"],
                                         "source": e["source"]} for e in ev]})
    scored.sort(key=lambda s: len(s["sources"]), reverse=True)
    return scored[:limit]


def llm_theses(api_key: str, items: list[dict], days: int = 14):
    """Ask an LLM to synthesize startup theses. Returns None on any failure."""
    if not api_key:
        return None
    model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5")
    corpus_items = recent(items, days)[:60]
    if not corpus_items:
        return None
    corpus = "\n".join(
        f"- [{it['source']}] {it['title']}: {it['summary'][:220]}"
        for it in corpus_items)
    prompt = (
        "You are an AI-infrastructure analyst helping an engineer spot startup "
        "opportunities. Based on these recent headlines from the last two weeks, "
        "identify the 3 most compelling startup-relevant theses: non-obvious "
        "connections, emerging bottlenecks, or shifts that create openings for "
        "new companies. Be concrete and opinionated; avoid generic advice.\n\n"
        "Return ONLY a JSON array of 3 objects with keys: "
        '"thesis" (one sharp sentence), '
        '"why_now" (1-2 sentences on timing), '
        '"evidence" (2-3 of the headline titles above, verbatim), '
        '"angle" (how a startup could attack this, 1-2 sentences).\n\n'
        f"Headlines:\n{corpus}"
    )
    body = json.dumps({"model": model, "max_tokens": 1600,
                       "messages": [{"role": "user", "content": prompt}]})
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages", data=body.encode(),
        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01",
                 "content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            data = json.loads(r.read())
        text = "".join(b.get("text", "") for b in data.get("content", [])
                        if b.get("type") == "text")
        m = re.search(r"\[.*\]", text, re.S)
        theses = json.loads(m.group(0)) if m else []
        return [t for t in theses
                if isinstance(t, dict) and t.get("thesis")][:3] or None
    except Exception as ex:
        print(f"LLM theses failed ({ex}); using heuristic intersections.",
              file=sys.stderr)
        return None


# ------------------------------------------------------- 4. people

def compute_people(items: list[dict], days: int = 14, limit: int = 6):
    out = []
    for it in recent(items, days):
        blob = f"{it['title']}. {it['summary']}"
        for sent in re.split(r"(?<=[.!?])\s+", blob):
            s = sent.strip()
            if len(s) > 40 and any(k in s.lower() for k in MOVE_KEYWORDS):
                out.append({"text": s[:240], "source": it["source"],
                            "link": it["link"]})
                break
    return out[:limit]


# ------------------------------------------------------- modes

def build_all():
    items = load_archive()
    trends, labels = compute_trends(items)
    return {
        "generated": dt.datetime.now(dt.timezone.utc).isoformat(),
        "archive_size": len(items),
        "trends": trends,
        "trend_labels": labels,
        "bottlenecks": compute_bottlenecks(items),
        "intersections": compute_intersections(items),
        "people": compute_people(items),
    }


def daily_pulse() -> dict:
    data = build_all()
    top = data["trends"][:5]
    return {
        "trending": [{"topic": t["topic"], "velocity": t["velocity"],
                      "current": t["current"]} for t in top],
        "bottlenecks": [{"topic": b["topic"], "count": b["count"]}
                        for b in data["bottlenecks"][:3]],
        "archive_size": data["archive_size"],
    }


HEAT_W, HEAT_H = None, None  # (kept for clarity; heatmap is HTML)


def render_weekly(data: dict, theses, date_str: str):
    from render_html import (SANS, INK, GRAY, LIGHT, BORDER, RED, esc)
    label = dt.datetime.strptime(date_str, "%Y-%m-%d").strftime("%B %d, %Y")

    def section_head(title: str, sub: str = "") -> str:
        sub_h = (f'<div style="font-family:{SANS};font-size:13px;color:{GRAY};'
                 f'margin-top:6px;">{esc(sub)}</div>' if sub else "")
        return (
            f'<div style="padding:26px 28px 0 28px;">'
            f'<div style="display:inline-block;font-family:{SANS};font-size:13px;'
            f'font-weight:800;letter-spacing:2px;color:{INK};'
            f'border-bottom:3px solid {RED};padding-bottom:7px;">'
            f'{esc(title)}</div>{sub_h}')

    # ---- 1. trend heatmap
    trends = data["trends"][:8]
    labels = data["trend_labels"]
    if trends:
        max_c = max(max(t["counts"]) for t in trends) or 1
        n = len(labels)
        head = "".join(
            f'<td style="font-family:{SANS};font-size:10px;color:{LIGHT};'
            f'padding:4px 6px;text-align:center;">{esc(labels[n - 1 - i])}</td>'
            for i in range(n))
        rows = ""
        for t in trends:
            cells = ""
            for i in range(n):
                c = t["counts"][n - 1 - i]
                a = 0.06 + 0.9 * (c / max_c)
                fg = "#ffffff" if a > 0.55 else INK
                cells += (
                    f'<td style="background:rgba(229,50,45,{a:.2f});color:{fg};'
                    f'font-family:{SANS};font-size:12px;font-weight:700;'
                    f'padding:8px 6px;text-align:center;">{c}</td>')
            rows += (
                f'<tr><td style="font-family:{SANS};font-size:12px;'
                f'font-weight:600;color:{INK};padding:8px 10px 8px 0;'
                f'white-space:nowrap;">{esc(t["topic"])}</td>{cells}</tr>')
        movers = "".join(
            f'<div style="font-family:{SANS};font-size:13.5px;color:#333;'
            f'margin-top:6px;">'
            f'<span style="color:{RED};font-weight:800;">&#9650;</span> '
            f'<b>{esc(t["topic"])}</b> '
            f'<span style="color:{LIGHT};">{t["velocity"]}x vs 4-week avg</span>'
            f'</div>' for t in data["trends"][:3])
        trend_body = (
            f'<div style="margin-top:14px;overflow-x:auto;">'
            f'<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">'
            f'<tr><td></td>{head}</tr>{rows}</table></div>'
            f'<div style="margin-top:12px;">{movers}</div>')
    else:
        trend_body = (
            f'<div style="font-family:{SANS};font-size:13px;font-style:italic;'
            f'color:{LIGHT};margin-top:12px;">Not enough archive history yet — '
            f'trends appear once a few weeks of digests accumulate.</div>')
    trend_sec = section_head("TREND MOMENTUM",
                             "Topic heat across the last 6 weeks (mentions per week).") \
        + trend_body + "</div>"

    # ---- 2. bottlenecks
    if data["bottlenecks"]:
        bns = ""
        max_b = max(b["count"] for b in data["bottlenecks"])
        for b in data["bottlenecks"]:
            w = max(8, int(100 * b["count"] / max_b))
            ev = "".join(
                f'<div style="margin-top:8px;"><a href="{esc(e["link"])}" '
                f'style="font-family:{SANS};font-size:13px;color:{INK};'
                f'text-decoration:none;">&ldquo;{esc(e["title"])}&rdquo;</a>'
                f'<div style="font-family:{SANS};font-size:11px;color:{LIGHT};'
                f'margin-top:2px;">{esc(e["source"])}</div></div>'
                for e in b["evidence"])
            bns += (
                f'<div style="padding:14px 0;border-bottom:1px solid {BORDER};">'
                f'<div style="font-family:{SANS};font-size:15px;font-weight:700;'
                f'color:{INK};">{esc(b["topic"])} '
                f'<span style="font-weight:400;color:{GRAY};font-size:13px;">'
                f'&middot; {b["count"]} pain signals</span></div>'
                f'<div style="background:#f3f3f3;height:6px;margin-top:8px;">'
                f'<div style="background:{RED};height:6px;width:{w}%;"></div></div>'
                f'{ev}</div>')
    else:
        bns = (f'<div style="font-family:{SANS};font-size:13px;font-style:italic;'
               f'color:{LIGHT};margin-top:12px;">No pain signals detected in the '
               f'last two weeks.</div>')
    bn_sec = section_head("BOTTLENECK RADAR",
                          "What the ecosystem keeps complaining about.") \
        + bns + "</div>"

    # ---- 3. dots connected
    if theses:
        cards = ""
        for i, t in enumerate(theses, 1):
            ev = "".join(f"<li style=\"margin-top:4px;\">{esc(e)}</li>"
                         for e in t.get("evidence", [])[:3])
            cards += (
                f'<div style="border:1px solid {BORDER};padding:16px 18px;'
                f'margin-top:14px;">'
                f'<div style="font-family:{SANS};font-size:11px;font-weight:700;'
                f'letter-spacing:2px;color:{RED};">THESIS {i}</div>'
                f'<div style="font-family:{SANS};font-size:16px;font-weight:800;'
                f'color:{INK};margin-top:8px;line-height:1.4;">'
                f'{esc(t.get("thesis", ""))}</div>'
                f'<div style="font-family:{SANS};font-size:13.5px;color:#444;'
                f'margin-top:8px;line-height:1.6;"><b>Why now:</b> '
                f'{esc(t.get("why_now", ""))}</div>'
                f'<ul style="font-family:{SANS};font-size:13px;color:#555;'
                f'margin:8px 0 0 0;padding-left:18px;">{ev}</ul>'
                f'<div style="font-family:{SANS};font-size:13.5px;color:#444;'
                f'margin-top:8px;line-height:1.6;"><b>Startup angle:</b> '
                f'{esc(t.get("angle", ""))}</div></div>')
        dots_body = cards
        dots_sub = "Synthesized from the last two weeks of headlines."
    else:
        inter = data["intersections"]
        if inter:
            cards = ""
            for s in inter:
                ev = "".join(
                    f'<div style="margin-top:8px;"><a href="{esc(e["link"])}" '
                    f'style="font-family:{SANS};font-size:13px;color:{INK};'
                    f'text-decoration:none;">&ldquo;{esc(e["title"])}&rdquo;</a>'
                    f'<div style="font-family:{SANS};font-size:11px;color:{LIGHT};'
                    f'margin-top:2px;">{esc(e["source"])}</div></div>'
                    for e in s["evidence"])
                cards += (
                    f'<div style="border:1px solid {BORDER};padding:16px 18px;'
                    f'margin-top:14px;">'
                    f'<div style="font-family:{SANS};font-size:15px;'
                    f'font-weight:800;color:{INK};">{esc(s["a"])} '
                    f'<span style="color:{RED};">&times;</span> {esc(s["b"])}</div>'
                    f'<div style="font-family:{SANS};font-size:13px;color:{GRAY};'
                    f'margin-top:6px;">Co-mentioned across '
                    f'{len(s["sources"])} sources this week — worth a closer look.</div>'
                    f'{ev}</div>')
            dots_body = cards
        else:
            dots_body = (
                f'<div style="font-family:{SANS};font-size:13px;font-style:italic;'
                f'color:{LIGHT};margin-top:12px;">No strong intersections yet.</div>')
        dots_sub = ("Auto-detected topic intersections. Add an ANTHROPIC_API_KEY "
                    "repo secret for full LLM-synthesized theses.")
    dots_sec = section_head("DOTS CONNECTED", dots_sub) + dots_body + "</div>"

    # ---- 4. people
    if data["people"]:
        ps = "".join(
            f'<div style="padding:12px 0;border-bottom:1px solid {BORDER};">'
            f'<div style="font-family:{SANS};font-size:13.5px;color:#333;'
            f'line-height:1.6;">{esc(p["text"])}</div>'
            f'<div style="margin-top:6px;"><a href="{esc(p["link"])}" '
            f'style="font-family:{SANS};font-size:12px;font-weight:600;'
            f'color:{RED};text-decoration:none;">Source &rarr;</a> '
            f'<span style="font-family:{SANS};font-size:11px;color:{LIGHT};">'
            f'{esc(p["source"])}</span></div></div>'
            for p in data["people"])
    else:
        ps = (f'<div style="font-family:{SANS};font-size:13px;font-style:italic;'
              f'color:{LIGHT};margin-top:12px;">No people-move signals this week.</div>')
    ppl_sec = section_head("PEOPLE MOVES",
                           "Hiring / founding / leaving signals (unverified).") \
        + ps + "</div>"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Infra Weekly Insights &middot; {esc(date_str)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;">
<div style="max-width:640px;margin:0 auto;background:#ffffff;">
  <div style="background:{RED};height:5px;font-size:0;line-height:0;">&nbsp;</div>
  <div style="padding:30px 28px 22px 28px;">
    <div style="font-family:{SANS};font-size:32px;font-weight:800;letter-spacing:-1px;color:{INK};line-height:1;">AI INFRA</div>
    <div style="font-family:{SANS};font-size:11px;font-weight:600;letter-spacing:3px;color:{GRAY};margin-top:10px;">WEEKLY INSIGHTS &nbsp;&middot;&nbsp; {esc(label).upper()} &nbsp;&middot;&nbsp; {data["archive_size"]} STORIES ANALYZED</div>
  </div>
  <div style="border-top:2px solid {INK};margin:0 28px;"></div>
  {trend_sec}
  {bn_sec}
  {dots_sec}
  {ppl_sec}
  <div style="margin:30px 28px 0 28px;border-top:2px solid {INK};"></div>
  <div style="text-align:center;padding:26px 28px 36px 28px;">
    <div style="font-family:{SANS};font-size:15px;font-weight:800;letter-spacing:-0.5px;color:{INK};">AI INFRA</div>
    <div style="font-family:{SANS};font-size:12px;color:{LIGHT};margin-top:8px;">Signals distilled from two weeks of digests &middot; heuristic + LLM</div>
    <div style="font-family:{SANS};font-size:11px;color:{LIGHT};margin-top:10px;">To unsubscribe, open an issue titled &ldquo;Unsubscribe&rdquo; at <a href="https://github.com/janehwzn/ai-infra-digest/issues" style="color:{GRAY};text-decoration:underline;">github.com/janehwzn/ai-infra-digest</a></div>
  </div>
</div>
</body>
</html>"""

    md_lines = [f"# AI Infra Weekly Insights · {date_str}",
                f"_Based on {data['archive_size']} stories from the last two weeks._", ""]
    md_lines.append("## Trend momentum")
    for t in data["trends"][:5]:
        md_lines.append(f"- **{t['topic']}** — {t['velocity']}x vs 4-week avg "
                        f"({t['current']} mentions this week)")
    md_lines += ["", "## Bottleneck radar"]
    for b in data["bottlenecks"]:
        md_lines.append(f"- **{b['topic']}** ({b['count']} signals)")
        for e in b["evidence"]:
            md_lines.append(f"  - [{e['title']}]({e['link']})")
    md_lines += ["", "## Dots connected"]
    if theses:
        for i, t in enumerate(theses, 1):
            md_lines.append(f"### Thesis {i}: {t.get('thesis', '')}")
            md_lines.append(f"Why now: {t.get('why_now', '')}")
            md_lines.append(f"Startup angle: {t.get('angle', '')}")
            md_lines.append("")
    else:
        for s in data["intersections"]:
            md_lines.append(
                f"- **{s['a']} × {s['b']}** (across {len(s['sources'])} sources)")
    md_lines += ["", "## People moves"]
    for p in data["people"]:
        md_lines.append(f"- {p['text']} ([source]({p['link']}))")
    md_lines.append("")
    return "\n".join(md_lines), html


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--daily", action="store_true")
    ap.add_argument("--weekly", action="store_true")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    if args.daily:
        pulse = daily_pulse()
        out = args.out
        payload = json.dumps(pulse, ensure_ascii=False)
        if out:
            with open(out, "w", encoding="utf-8") as f:
                f.write(payload)
            print(f"Wrote {out}")
        else:
            print(payload)
    elif args.weekly:
        out_dir = args.out or os.path.join(BASE_DIR, "digests")
        os.makedirs(out_dir, exist_ok=True)
        data = build_all()
        date_str = dt.datetime.now().strftime("%Y-%m-%d")
        theses = llm_theses(os.environ.get("ANTHROPIC_API_KEY"), load_archive())
        md, html = render_weekly(data, theses, date_str)
        md_path = os.path.join(out_dir, f"weekly-{date_str}.md")
        html_path = os.path.join(out_dir, f"weekly-{date_str}.html")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Wrote {md_path} and {html_path} "
              f"({data['archive_size']} stories, "
              f"{'LLM' if theses else 'heuristic'} theses)")
    else:
        ap.error("choose --daily or --weekly")


if __name__ == "__main__":
    sys.exit(main())
