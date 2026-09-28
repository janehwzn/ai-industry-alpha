#!/usr/bin/env python3
"""Send the generated digest Markdown via Gmail.

Environment variables:
  GMAIL_USER          Gmail address (also the default recipient)
  GMAIL_APP_PASSWORD  Google app-specific password
  RECIPIENT           Recipient (optional, defaults to GMAIL_USER)

Usage: python3 send_email.py digests/2026-09-28.md [--html digests/2026-09-28.html]
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("digest", help="Markdown digest file")
    ap.add_argument("--html", default=None, help="HTML version to send as rich email body")
    args = ap.parse_args()

    with open(args.digest, encoding="utf-8") as f:
        body = f.read()
    html_body = None
    if args.html:
        with open(args.html, encoding="utf-8") as f:
            html_body = f.read()

    user = os.environ["GMAIL_USER"]
    password = os.environ["GMAIL_APP_PASSWORD"]
    to = os.environ.get("RECIPIENT") or user
    date_str = dt.date.today().isoformat()

    if html_body:
        msg = MIMEMultipart("alternative")
        msg.attach(MIMEText(body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))
    else:
        msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = Header(f"AI Infra Daily Digest {date_str}", "utf-8")
    msg["From"] = user
    msg["To"] = to

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(user, password)
        server.send_message(msg)
    print(f"Email sent to {to}")


if __name__ == "__main__":
    main()
