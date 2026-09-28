#!/usr/bin/env python3
"""Send the generated digest Markdown via Gmail.

Environment variables:
  GMAIL_USER          Gmail address (also the default recipient)
  GMAIL_APP_PASSWORD  Google app-specific password
  RECIPIENT           Recipient(s), comma-separated (optional, defaults to
                      GMAIL_USER). Each recipient gets an individual email so
                      nobody sees anyone else's address.

Usage: python3 send_email.py digests/2026-09-28.md [--html digests/2026-09-28.html]
       [--recipients-file subscribers.txt]
"""
import argparse
import datetime as dt
import os
import smtplib
import ssl
import sys
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def parse_recipients(raw: str | None, fallback: str) -> list[str]:
    """Comma-separated RECIPIENT -> deduped list; falls back to the sender."""
    recips = [r.strip() for r in (raw or "").split(",") if r.strip()]
    if not recips:
        recips = [fallback]
    seen, out = set(), []
    for r in recips:
        if r not in seen:
            seen.add(r)
            out.append(r)
    return out


def build_message(body: str, html_body: str | None, date_str: str,
                  user: str, to: str):
    if html_body:
        msg = MIMEMultipart("alternative")
        msg.attach(MIMEText(body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))
    else:
        msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = Header(f"AI Infra Daily Digest {date_str}", "utf-8")
    msg["From"] = user
    msg["To"] = to
    return msg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("digest", help="Markdown digest file")
    ap.add_argument("--html", default=None, help="HTML version to send as rich email body")
    ap.add_argument("--recipients-file", default=None,
                    help="File with one email per line; merged into the recipient list")
    args = ap.parse_args()

    with open(args.digest, encoding="utf-8") as f:
        body = f.read()
    html_body = None
    if args.html:
        with open(args.html, encoding="utf-8") as f:
            html_body = f.read()

    user = os.environ["GMAIL_USER"]
    password = os.environ["GMAIL_APP_PASSWORD"]
    file_recips: list[str] = []
    if args.recipients_file and os.path.exists(args.recipients_file):
        with open(args.recipients_file, encoding="utf-8") as f:
            file_recips = [line.strip() for line in f if line.strip()]
    raw = ",".join(file_recips + [os.environ.get("RECIPIENT") or ""])
    recipients = parse_recipients(raw, user)
    date_str = dt.date.today().isoformat()

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(user, password)
        for to in recipients:
            server.send_message(build_message(body, html_body, date_str, user, to))
    print(f"Email sent to {len(recipients)} recipient(s): {', '.join(recipients)}")


if __name__ == "__main__":
    main()
