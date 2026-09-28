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

## 定时邮件

可配合 cron 每周一至周五早上运行 `fetch.py --days 1`（周一用 `--days 3`），把生成的 Markdown 发到邮箱。
