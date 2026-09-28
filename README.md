# AI Infra 每日速览

每天聚合 AI 基础设施领域的资讯：推理 serving、GPU 调度、编排、成本优化、数据中心。

## 数据源

| 来源 | 类型 |
|------|------|
| SemiAnalysis | 行业分析 |
| Latent Space | Newsletter |
| Import AI | Newsletter |
| TLDR AI | Newsletter |
| Anyscale Blog | 公司博客 |
| Modal Blog | 公司博客 |
| vLLM Releases | 开源项目动态 |
| SGLang Releases | 开源项目动态 |

## 用法

```bash
pip install -r requirements.txt
python3 fetch.py              # 抓取最近 3 天
python3 fetch.py --days 1     # 抓取最近 1 天
python3 fetch.py --out digests/ --days 7
```

输出 `digests/YYYY-MM-DD.md`，按来源分组，含标题、链接和摘要。

## GitHub Actions 自动运行（推荐）

仓库里已配好 `.github/workflows/digest.yml`：每周一至周五早上 7:15（美西时间）自动抓取、生成 digest 并发邮件。周一自动回看 3 天，其余每天回看 1 天。

启用只需两步：

1. 生成一个 Google 应用专用密码：打开 [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)（需要先开两步验证），创建一个专用密码并复制。
2. 在本仓库页面点 **Settings → Secrets and variables → Actions → New repository secret**，添加两个 secret：
   - `GMAIL_USER`：你的 Gmail 地址（发件人）
   - `GMAIL_APP_PASSWORD`：上一步生成的专用密码
   - 可选 `RECIPIENT`：收件人，不填则默认发给自己

配好后每天自动运行，也可以随时去 **Actions → AI Infra Daily Digest → Run workflow** 手动触发一次。

## 本地定时（备选）

也可以用 cron 在本地跑 `fetch.py`，再用 `send_email.py` 发信：

```bash
python3 fetch.py --days 1
python3 send_email.py digests/2026-09-28.md  # 需设置 GMAIL_USER / GMAIL_APP_PASSWORD
```
