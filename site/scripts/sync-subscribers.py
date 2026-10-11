#!/usr/bin/env python3
"""Build the newsletter recipient list at send time (never committed).

Merges the legacy repo file subscribers.txt with signups from Supabase and
writes the result to --out (e.g. $RUNNER_TEMP/recipients.txt), so subscriber
emails are never written into this public repository. Addresses listed in the
SUPPRESSION_LIST env/secret (comma-separated) are removed (unsubscribes).

Original note: sync newsletter signups from Supabase into subscribers.txt.

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
import argparse
import json
import os
import sys
import urllib.request

REPO_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SUBSCRIBERS_FILE = os.path.join(REPO_DIR, "subscribers.txt")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, help="Recipient file to write (outside the repo)")
    args = parser.parse_args()

    emails: set[str] = set()
    if os.path.exists(SUBSCRIBERS_FILE):
        with open(SUBSCRIBERS_FILE, encoding="utf-8") as f:
            for line in f:
                line = line.strip().lower()
                if line and "@" in line and not line.startswith("#"):
                    emails.add(line)
    legacy = len(emails)

    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    remote = 0
    if url and key:
        req = urllib.request.Request(
            f"{url}/rest/v1/newsletter_subscribers?select=email",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                rows = json.loads(resp.read().decode("utf-8"))
            for r in rows:
                e = str(r.get("email", "")).strip().lower()
                if e and "@" in e:
                    emails.add(e)
                    remote += 1
        except Exception as e:  # never break the send on a sync failure
            print(f"sync-subscribers: Supabase fetch failed ({type(e).__name__}), using legacy list only.")
    else:
        print("sync-subscribers: Supabase not configured, using legacy list only.")

    suppressed = {x.strip().lower() for x in os.environ.get("SUPPRESSION_LIST", "").split(",") if x.strip()}
    emails -= suppressed

    with open(args.out, "w", encoding="utf-8") as f:
        for e in sorted(emails):
            f.write(e + "\n")
    # Counts only; never print addresses (logs are public).
    print(f"sync-subscribers: legacy={legacy} supabase={remote} suppressed={len(suppressed)} total={len(emails)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
