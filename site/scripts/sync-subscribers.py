#!/usr/bin/env python3
"""Sync newsletter signups from Supabase into subscribers.txt.

The site's free-newsletter form writes to the Supabase table
`newsletter_subscribers`. The digest email pipeline (digest.yml) sends via
Gmail SMTP to the addresses in subscribers.txt, so this script merges any
new Supabase signups in before sending.

Runs as a guarded step in digest.yml: exits 0 (skipping) when the Supabase
credentials are not configured, so the digest never breaks because of it.

Environment:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
"""
import json
import os
import sys
import urllib.request

REPO_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SUBSCRIBERS_FILE = os.path.join(REPO_DIR, "subscribers.txt")


def main() -> int:
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        print("sync-subscribers: Supabase not configured, skipping.")
        return 0
    req = urllib.request.Request(
        f"{url}/rest/v1/newsletter_subscribers?select=email",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
    except Exception as e:  # never break the digest on a sync failure
        print(f"sync-subscribers: fetch failed ({e}), skipping.")
        return 0
    new_emails = {str(r.get("email", "")).strip().lower() for r in rows if r.get("email")}
    new_emails.discard("")
    existing: set[str] = set()
    if os.path.exists(SUBSCRIBERS_FILE):
        with open(SUBSCRIBERS_FILE, encoding="utf-8") as f:
            for line in f:
                line = line.strip().lower()
                if line and "@" in line:
                    existing.add(line)
    added = sorted(new_emails - existing)
    if added:
        with open(SUBSCRIBERS_FILE, "a", encoding="utf-8") as f:
            for email in added:
                f.write(email + "\n")
    print(f"sync-subscribers: {len(new_emails)} in Supabase, {len(added)} new -> subscribers.txt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
