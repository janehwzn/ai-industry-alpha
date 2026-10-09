#!/usr/bin/env python3
"""Email the site owner about new advertising inquiries.

Queries public.advertising_inquiries for rows where notified_at IS NULL,
emails a summary via Gmail SMTP, then marks them notified. Safe to run on
a schedule; exits quietly when there is nothing new.

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER,
     GMAIL_APP_PASSWORD, RECIPIENT (defaults to GMAIL_USER).
"""
import json
import os
import smtplib
import ssl
import sys
import urllib.request
import urllib.error
from email.message import EmailMessage


def sb(path, method="GET", payload=None):
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1" + path
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    if data:
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            body = r.read().decode()
            return json.loads(body) if body else []
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Supabase {e.code}: {e.read().decode()[:200]}")


def main():
    rows = sb("/advertising_inquiries"
              "?select=id,name,email,company,message,created_at"
              "&notified_at=is.null&order=created_at.asc")
    if not rows:
        print("No new advertising inquiries.")
        return

    lines = ["# New advertising inquiries", ""]
    for r in rows:
        lines.append(f"## {r['name']} ({r['email']})")
        if r.get("company"):
            lines.append(f"Company: {r['company']}")
        lines.append(f"Submitted: {r['created_at']}")
        lines.append("")
        lines.append(r["message"] or "")
        lines.append("")
    body = "\n".join(lines)

    user = os.environ["GMAIL_USER"]
    password = <redacted>
    recipient = os.environ.get("RECIPIENT") or user
    msg = EmailMessage()
    msg["From"] = user
    msg["To"] = recipient
    msg["Subject"] = (f"AI Industry Alpha: {len(rows)} new advertising "
                      f"{'inquiry' if len(rows) == 1 else 'inquiries'}")
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(user, password)
        server.send_message(msg)
    print(f"Emailed {len(rows)} new inquiries to {recipient}")

    for r in rows:
        sb(f"/advertising_inquiries?id=eq.{r['id']}", "PATCH",
           {"notified_at": "now()"})
    print("Marked as notified.")


if __name__ == "__main__":
    sys.exit(main())
