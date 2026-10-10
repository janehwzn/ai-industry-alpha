const TOPICS = [
  { id: 'agents', name: 'AI agents in production', keywords: /agent|computer use|workflow automation|autonomous|agentic/i, question: 'Which workflow is reliable enough to own end-to-end—not just demo?' },
  { id: 'inference', name: 'Inference economics', keywords: /inference|serving|token cost|pricing|latency|gpu|compute|model routing|quantiz/i, question: 'Can a 10× improvement in cost, latency, or utilization unlock a workflow that is uneconomic today?' },
  { id: 'enterprise', name: 'Vertical AI workflows', keywords: /enterprise|healthcare|legal|insurance|finance|customer support|coding|sales|clinical|drug discovery/i, question: 'Which narrow workflow has a budget owner, repeat usage, and measurable ROI?' },
  { id: 'trust', name: 'Evaluation, security & trust', keywords: /evaluation|evals|benchmark|security|safety|guardrail|observability|monitoring|deepfake|compliance|governance/i, question: 'What breaks when an AI feature moves from pilot to a production system with real consequences?' },
  { id: 'data', name: 'Data & context infrastructure', keywords: /data quality|knowledge graph|retrieval|rag|context|vector database|synthetic data|data pipeline|unstructured data/i, question: 'What proprietary context or workflow state is missing from generic model APIs?' },
  { id: 'infra', name: 'Compute, power & deployment', keywords: /data center|datacenter|power|energy|cooling|gpu|chip|cluster|infrastructure|edge ai|on-device/i, question: 'Where is scarce capacity, power, memory, or deployment flexibility creating a software wedge?' },
]

const DAY = 24 * 60 * 60 * 1000
const publishedAt = (story) => {
  const value = new Date(story.pub || story.date || 0).getTime()
  return Number.isFinite(value) ? value : 0
}
const storyText = (story) => `${story.title || ''} ${story.summary || ''}`
const distinctSources = (stories) => new Set(stories.map((s) => s.source).filter(Boolean)).size

export function buildFounderSignals(headlines = []) {
  const now = Date.now()
  const recent = headlines.filter((s) => publishedAt(s) >= now - 7 * DAY)
  const prior = headlines.filter((s) => publishedAt(s) >= now - 30 * DAY && publishedAt(s) < now - 7 * DAY)
  const topics = TOPICS.map((topic) => {
    const currentStories = recent.filter((s) => topic.keywords.test(storyText(s)))
    const priorStories = prior.filter((s) => topic.keywords.test(storyText(s)))
    const priorWeeklyRate = priorStories.length / (23 / 7)
    const ratio = currentStories.length / Math.max(priorWeeklyRate, 0.5)
    const sources = distinctSources(currentStories)
    return {
      ...topic,
      currentCount: currentStories.length,
      priorWeeklyRate,
      ratio,
      sources,
      stories: currentStories.sort((a, b) => publishedAt(b) - publishedAt(a)).slice(0, 4),
      status: currentStories.length >= 3 && ratio >= 1.4 ? 'Accelerating coverage'
        : currentStories.length >= 2 && sources >= 2 ? 'Multi-source signal'
          : 'Early watch',
    }
  }).filter((topic) => topic.currentCount >= 2 && topic.sources >= 2)
    .sort((a, b) => (b.currentCount * Math.min(b.ratio, 3)) - (a.currentCount * Math.min(a.ratio, 3)))

  const opportunities = TOPICS.map((topic) => {
    const stories = headlines.filter((s) => publishedAt(s) >= now - 30 * DAY && topic.keywords.test(storyText(s)))
      .sort((a, b) => publishedAt(b) - publishedAt(a))
    const sources = distinctSources(stories)
    return { ...topic, stories: stories.slice(0, 3), evidenceCount: stories.length, sources }
  }).filter((topic) => topic.evidenceCount >= 3 && topic.sources >= 2)
    .sort((a, b) => (b.sources * 2 + b.evidenceCount) - (a.sources * 2 + a.evidenceCount))

  const watchItems = headlines.filter((s) => publishedAt(s) >= now - 14 * DAY &&
    /raises? \$|\$\d+(?:\.\d+)?\s?(?:m|b|million|billion)|series [a-f]|acquir|acquisition|launch(?:es|ed)?|open[- ]source|pricing|price cut|benchmark|general availability/i.test(storyText(s)))
    .sort((a, b) => publishedAt(b) - publishedAt(a))
    .slice(0, 8)

  return { topics, opportunities, watchItems, recentCount: recent.length, priorCount: prior.length }
}
