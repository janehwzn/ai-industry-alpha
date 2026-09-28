#!/usr/bin/env python3
"""把生成的 digest Markdown 通过 Gmail 发出去.

环境变量:
  GMAIL_USER          Gmail 地址 (也是默认收件人)
  GMAIL_APP_PASSWORD  Google 应用专用密码
  RECIPIENT           收件人 (可选,默认等于 GMAIL_USER)

用法: python3 send_email.py digests/2026-09-28.md
"""
import datetime as dt
import os
import smtplib
import ssl
import sys
from email.header import Header
from email.mime.text import MIMEText


def main():
    if len(sys.argv) < 2:
        print("用法: python3 send_email.py <digest.md>", file=sys.stderr)
        sys.exit(2)
    digest_path = sys.argv[1]
    with open(digest_path, encoding="utf-8") as f:
        body = f.read()

    user = os.environ["GMAIL_USER"]
    password = os.environ["GMAIL_APP_PASSWORD"]
    to = os.environ.get("RECIPIENT", user)
    date_str = dt.date.today().isoformat()

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = Header(f"AI Infra 每日速览 {date_str}", "utf-8")
    msg["From"] = user
    msg["To"] = to

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(user, password)
        server.send_message(msg)
    print(f"邮件已发送至 {to}")


if __name__ == "__main__":
    main()
