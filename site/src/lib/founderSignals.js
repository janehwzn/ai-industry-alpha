const TOPICS = [
  {
    id: 'agents', name: 'AI agents in production',
    keywords: /agent|computer use|workflow automation|autonomous|agentic/i,
    question: 'Which workflow is reliable enough to own end-to-end—not just demo?',
    buyer: 'Operations leaders with repetitive, exception-heavy workflows',
    wedge: 'An agent that completes one measurable workflow with auditability and a human fallback.',
    test: 'Interview 5 operations leaders. Ask for the last three times this workflow failed, its cost, and the exception rate they would tolerate.',
    falsifier: 'Buyers cannot name a frequent, costly workflow—or every exception requires bespoke human judgment.',
    metric: 'Percent of workflow completed without intervention; time saved per completed case.',
  },
  {
    id: 'inference', name: 'Inference economics',
    keywords: /inference|serving|token cost|pricing|latency|gpu|compute|model routing|quantiz/i,
    question: 'Can a 10× improvement in cost, latency, or utilization unlock a workflow that is uneconomic today?',
    buyer: 'Teams running high-volume model workloads with a visible cloud bill',
    wedge: 'Workload-specific routing, caching, evaluation, or serving optimization with a provable bill reduction.',
    test: 'Ask 5 AI engineering teams to walk through a real inference bill and identify the single largest avoidable cost.',
    falsifier: 'The cost is immaterial to the buyer, or savings disappear after quality, engineering time, and reliability are included.',
    metric: 'Cost per successful task at a fixed quality and latency target.',
  },
  {
    id: 'enterprise', name: 'Vertical AI workflows',
    keywords: /enterprise|healthcare|legal|insurance|finance|customer support|coding|sales|clinical|drug discovery/i,
    question: 'Which narrow workflow has a budget owner, repeat usage, and measurable ROI?',
    buyer: 'A specific functional leader who owns the workflow and its operating budget',
    wedge: 'A domain-specific workflow product that owns the outcome, not another general-purpose assistant.',
    test: 'Interview 5 people with the same job title. Map their current workflow, workaround, approval path, and budget owner.',
    falsifier: 'The pain is infrequent, the buyer is unclear, or procurement/security costs exceed the value created.',
    metric: 'Repeat usage and verified time, error, or cost reduction per workflow.',
  },
  {
    id: 'trust', name: 'Evaluation, security & trust',
    keywords: /evaluation|evals|benchmark|security|safety|guardrail|observability|monitoring|deepfake|compliance|governance/i,
    question: 'What breaks when an AI feature moves from pilot to production with real consequences?',
    buyer: 'AI platform, security, risk, or compliance owners accountable for production incidents',
    wedge: 'A narrow control plane for evaluating, tracing, or governing one consequential AI workflow.',
    test: 'Ask 5 teams to show their last AI incident, failed evaluation, or launch blocker and the current mitigation.',
    falsifier: 'Existing platform tools solve the problem well enough, or no one owns the risk budget.',
    metric: 'Time to detect and resolve failures; escaped error rate; audit effort.',
  },
  {
    id: 'data', name: 'Data & context infrastructure',
    keywords: /data quality|knowledge graph|retrieval|rag|context|vector database|synthetic data|data pipeline|unstructured data/i,
    question: 'What proprietary context or workflow state is missing from generic model APIs?',
    buyer: 'Teams whose AI systems fail because internal knowledge is stale, fragmented, or inaccessible',
    wedge: 'A trusted context layer for one data source and one high-value workflow, with freshness and permissions built in.',
    test: 'Ask 5 teams to trace one wrong AI answer to the source data, freshness, permissions, or retrieval step.',
    falsifier: 'Failures are mostly model reasoning errors, or a simple connector and prompt fix solves them.',
    metric: 'Grounded-answer rate, freshness lag, and successful task completion.',
  },
  {
    id: 'infra', name: 'Compute, power & deployment',
    keywords: /data center|datacenter|power|energy|cooling|gpu|chip|cluster|infrastructure|edge ai|on-device/i,
    question: 'Where is scarce capacity, power, memory, or deployment flexibility creating a software wedge?',
    buyer: 'Infrastructure owners constrained by capacity, utilization, reliability, or deployment requirements',
    wedge: 'Software that increases useful utilization or makes workloads portable across constrained environments.',
    test: 'Ask 5 infrastructure owners what capacity constraint is actually blocking delivery and what they have tried already.',
    falsifier: 'The bottleneck is purely physical capital, or a vendor roadmap will remove it before a startup can win.',
    metric: 'Useful throughput per dollar or watt, plus operational reliability.',
  },
]

const DAY = 24 * 60 * 60 * 1000
const publishedAt = (story) => {
  const value = new Date(story.pub || story.date || 0).getTime()
  return Number.isFinite(value) ? value : 0
}
const storyText = (story) => `${story.title || ''} ${story.summary || ''}`
const distinctSources = (stories) => new Set(stories.map((s) => s.source).filter(Boolean)).size
const newestFirst = (a, b) => publishedAt(b) - publishedAt(a)

function timelineFor(stories, now) {
  return Array.from({ length: 4 }, (_, index) => {
    const end = now - index * 7 * DAY
    const start = end - 7 * DAY
    return {
      label: index === 0 ? 'This week' : index === 1 ? '1 week ago' : index === 2 ? '2 weeks ago' : '3 weeks ago',
      count: stories.filter((story) => publishedAt(story) >= start && publishedAt(story) < end).length,
    }
  }).reverse()
}

export function buildFounderSignals(headlines = []) {
  const now = Date.now()
  const recent = headlines.filter((s) => publishedAt(s) >= now - 7 * DAY && publishedAt(s) <= now + DAY)
  const month = headlines.filter((s) => publishedAt(s) >= now - 30 * DAY && publishedAt(s) <= now + DAY)
  const prior = headlines.filter((s) => publishedAt(s) >= now - 30 * DAY && publishedAt(s) < now - 7 * DAY)

  const topics = TOPICS.map((topic) => {
    const currentStories = recent.filter((s) => topic.keywords.test(storyText(s))).sort(newestFirst)
    const monthStories = month.filter((s) => topic.keywords.test(storyText(s))).sort(newestFirst)
    const priorStories = prior.filter((s) => topic.keywords.test(storyText(s)))
    const priorWeeklyRate = priorStories.length / (23 / 7)
    const ratio = currentStories.length / Math.max(priorWeeklyRate, 0.5)
    const sources = distinctSources(currentStories)
    const monthSources = distinctSources(monthStories)
    const timeline = timelineFor(monthStories, now)
    const sourceNames = [...new Set(currentStories.map((s) => s.source).filter(Boolean))]
    return {
      ...topic,
      currentCount: currentStories.length,
      monthCount: monthStories.length,
      priorWeeklyRate,
      ratio,
      sources,
      monthSources,
      sourceNames,
      timeline,
      stories: currentStories.slice(0, 4),
      status: currentStories.length >= 3 && ratio >= 1.4 ? 'Coverage rising'
        : currentStories.length >= 2 && sources >= 2 ? 'Multi-source signal'
          : 'Early watch',
      momentum: currentStories.length >= 2 && ratio >= 1.4 ? 'up'
        : currentStories.length > 0 && ratio <= 0.65 ? 'down' : 'mixed',
    }
  }).filter((topic) => topic.currentCount >= 2 && topic.sources >= 2)
    .sort((a, b) => (b.currentCount * Math.min(b.ratio, 3)) - (a.currentCount * Math.min(a.ratio, 3)))

  const opportunities = TOPICS.map((topic) => {
    const stories = month.filter((s) => topic.keywords.test(storyText(s))).sort(newestFirst)
    const sources = distinctSources(stories)
    const weeklyMentions = timelineFor(stories, now)
    return { ...topic, stories: stories.slice(0, 4), evidenceCount: stories.length, sources, timeline: weeklyMentions }
  }).filter((topic) => topic.evidenceCount >= 3 && topic.sources >= 2)
    .sort((a, b) => (b.sources * 2 + b.evidenceCount) - (a.sources * 2 + a.evidenceCount))

  const watchItems = headlines.filter((s) => publishedAt(s) >= now - 14 * DAY && publishedAt(s) <= now + DAY &&
    /raises? \$|\$\d+(?:\.\d+)?\s?(?:m|b|million|billion)|series [a-f]|acquir|acquisition|launch(?:es|ed)?|open[- ]source|pricing|price cut|benchmark|general availability|release(?:s|d)?|partnership|customer/i.test(storyText(s)))
    .sort(newestFirst)
    .slice(0, 8)

  const lead = opportunities[0] || topics[0] || null
  const brief = lead ? {
    ...lead,
    evidenceStories: lead.stories.slice(0, 3),
    confidenceLabel: lead.sources >= 4 && lead.evidenceCount >= 6 ? 'Broad coverage, still unvalidated'
      : lead.sources >= 2 ? 'Early cross-source signal' : 'Single-source watch',
    nextMove: lead.test,
  } : null

  return { topics, opportunities, watchItems, brief, recentCount: recent.length, priorCount: prior.length, monthCount: month.length }
}
