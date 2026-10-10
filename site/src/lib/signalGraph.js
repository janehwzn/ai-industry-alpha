const ENTITY_CATALOG = [
  { id: 'openai', name: 'OpenAI', kind: 'AI labs', aliases: ['OpenAI'] },
  { id: 'anthropic', name: 'Anthropic', kind: 'AI labs', aliases: ['Anthropic'] },
  { id: 'google', name: 'Google', kind: 'Big Tech', aliases: ['Google', 'Google DeepMind'] },
  { id: 'deepmind', name: 'DeepMind', kind: 'AI labs', aliases: ['DeepMind', 'Google DeepMind'] },
  { id: 'microsoft', name: 'Microsoft', kind: 'Big Tech', aliases: ['Microsoft'] },
  { id: 'meta', name: 'Meta', kind: 'Big Tech', aliases: ['Meta'] },
  { id: 'amazon', name: 'Amazon', kind: 'Big Tech', aliases: ['Amazon', 'AWS'] },
  { id: 'apple', name: 'Apple', kind: 'Big Tech', aliases: ['Apple'] },
  { id: 'nvidia', name: 'NVIDIA', kind: 'Compute & infrastructure', aliases: ['NVIDIA', 'Nvidia'] },
  { id: 'amd', name: 'AMD', kind: 'Compute & infrastructure', aliases: ['AMD'] },
  { id: 'coreweave', name: 'CoreWeave', kind: 'Compute & infrastructure', aliases: ['CoreWeave'] },
  { id: 'oracle', name: 'Oracle', kind: 'Big Tech', aliases: ['Oracle'] },
  { id: 'xai', name: 'xAI', kind: 'AI labs', aliases: ['xAI'] },
  { id: 'mistral', name: 'Mistral AI', kind: 'AI labs', aliases: ['Mistral'] },
  { id: 'cohere', name: 'Cohere', kind: 'AI labs', aliases: ['Cohere'] },
  { id: 'databricks', name: 'Databricks', kind: 'Data & platforms', aliases: ['Databricks'] },
  { id: 'scale-ai', name: 'Scale AI', kind: 'Data & platforms', aliases: ['Scale AI'] },
  { id: 'hugging-face', name: 'Hugging Face', kind: 'Data & platforms', aliases: ['Hugging Face'] },
  { id: 'modal', name: 'Modal', kind: 'Compute & infrastructure', aliases: ['Modal Labs', 'Modal'] },
  { id: 'anyscale', name: 'Anyscale', kind: 'Compute & infrastructure', aliases: ['Anyscale'] },
  { id: 'vllm', name: 'vLLM', kind: 'Open source & tools', aliases: ['vLLM'] },
  { id: 'sglang', name: 'SGLang', kind: 'Open source & tools', aliases: ['SGLang'] },
  { id: 'runway', name: 'Runway', kind: 'AI products', aliases: ['Runway'] },
  { id: 'perplexity', name: 'Perplexity', kind: 'AI products', aliases: ['Perplexity'] },
  { id: 'cursor', name: 'Cursor', kind: 'AI products', aliases: ['Cursor'] },
  { id: 'windsurf', name: 'Windsurf', kind: 'AI products', aliases: ['Windsurf'] },
  { id: 'glean', name: 'Glean', kind: 'AI products', aliases: ['Glean'] },
  { id: 'harvey', name: 'Harvey', kind: 'AI products', aliases: ['Harvey'] },
  { id: 'world-labs', name: 'World Labs', kind: 'AI labs', aliases: ['World Labs'] },
  { id: 'spacex', name: 'SpaceX', kind: 'Compute & infrastructure', aliases: ['SpaceX'] },
  { id: 'netapp', name: 'NetApp', kind: 'Compute & infrastructure', aliases: ['NetApp'] },
  { id: 'liquid-ai', name: 'Liquid AI', kind: 'AI labs', aliases: ['Liquid AI'] },
  { id: 'goodfire', name: 'Goodfire', kind: 'AI labs', aliases: ['Goodfire'] },
  { id: 'arena', name: 'Arena', kind: 'Data & platforms', aliases: ['Arena'] },
  { id: 'manus', name: 'Manus', kind: 'AI products', aliases: ['Manus'] },
  { id: 'eluum', name: 'Eluum', kind: 'AI products', aliases: ['Eluum'] },
  { id: 'gallatin-ai', name: 'Gallatin AI', kind: 'AI products', aliases: ['Gallatin AI'] },
  { id: 'satlyt', name: 'Satlyt', kind: 'Compute & infrastructure', aliases: ['Satlyt'] },
  { id: 'rig-security', name: 'Rig Security', kind: 'Security', aliases: ['Rig Security'] },
  { id: 'stripe', name: 'Stripe', kind: 'Big Tech', aliases: ['Stripe'] },
  { id: 'openrouter', name: 'OpenRouter', kind: 'AI products', aliases: ['OpenRouter'] },
  { id: 'nscale', name: 'Nscale', kind: 'Compute & infrastructure', aliases: ['Nscale'] },
  { id: 'island', name: 'Island', kind: 'AI products', aliases: ['Island'] },
  { id: 'row-zero', name: 'Row Zero', kind: 'AI products', aliases: ['Row Zero'] },
  { id: '8vc', name: '8VC', kind: 'Investors', aliases: ['8VC'] },
  { id: 'sequoia', name: 'Sequoia', kind: 'Investors', aliases: ['Sequoia'] },
  { id: 'benchmark', name: 'Benchmark', kind: 'Investors', aliases: ['Benchmark'] },
  { id: 'lightspeed', name: 'Lightspeed', kind: 'Investors', aliases: ['Lightspeed'] },
  { id: 'yc', name: 'Y Combinator', kind: 'Investors', aliases: ['Y Combinator', 'YC'] },
  { id: 'tesla', name: 'Tesla', kind: 'Big Tech', aliases: ['Tesla'] },
]

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const normalize = (value) => (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function findEntities(text) {
  const found = []
  for (const entity of ENTITY_CATALOG) {
    const matched = entity.aliases.some((alias) => {
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias)}([^a-z0-9]|$)`, 'i')
      return pattern.test(text)
    })
    if (matched) found.push(entity)
  }
  // Google DeepMind is one organization in this graph, not two nodes.
  if (found.some((entity) => entity.id === 'deepmind') && found.some((entity) => entity.id === 'google')) {
    const deepmindOnly = /google deepmind/i.test(text) && !/\bgoogle\b.{0,30}\bdeepmind\b/i.test(text.replace(/google deepmind/ig, ''))
    if (deepmindOnly) return found.filter((entity) => entity.id !== 'google')
  }
  return found
}

function contextForStory(story) {
  const text = `${story.title || ''} ${story.summary || ''}`.toLowerCase()
  if (/\b(acquir|acquisition|acquired|buys|bought|merger|merges)\b/.test(text)) return 'M&A / acquisition coverage'
  if (/\b(raises|raised|funding|fundraise|series [a-f]|valuation|investment|investor|round)\b/.test(text)) return 'Funding / capital coverage'
  if (/\b(partner|partnership|collaboration|joint venture|agreement with)\b/.test(text)) return 'Partnership coverage'
  if (/\b(launch|launches|launched|release|releases|released|ships|unveils|introduces)\b/.test(text)) return 'Product / release coverage'
  if (/\b(gpu|compute|inference|data cent(er|re)|datacenter|infrastructure|power grid|chip)\b/.test(text)) return 'Compute / infrastructure coverage'
  if (/\b(model|benchmark|training|research|open weights|llm)\b/.test(text)) return 'Model / research coverage'
  return 'Industry coverage'
}

export function buildSignalGraph(headlines = []) {
  const entityMap = new Map()
  const edgeMap = new Map()
  const storyEntities = new Map()

  headlines.forEach((story) => {
    const text = `${story.title || ''}. ${story.summary || ''}`
    const found = findEntities(text)
    storyEntities.set(story.id, found.map((entity) => entity.id))
    found.forEach((entity) => {
      if (!entityMap.has(entity.id)) entityMap.set(entity.id, { ...entity, stories: [] })
      entityMap.get(entity.id).stories.push(story)
    })
    if (found.length < 2) return
    const context = contextForStory(story)
    for (let i = 0; i < found.length; i += 1) {
      for (let j = i + 1; j < found.length; j += 1) {
        const pair = [found[i].id, found[j].id].sort()
        const key = pair.join('::')
        if (!edgeMap.has(key)) edgeMap.set(key, { id: key, source: pair[0], target: pair[1], stories: [], contexts: {} })
        const edge = edgeMap.get(key)
        edge.stories.push(story)
        edge.contexts[context] = (edge.contexts[context] || 0) + 1
      }
    }
  })

  const nodes = Array.from(entityMap.values()).map((node) => ({
    ...node,
    stories: node.stories.sort((a, b) => new Date(b.pub || b.date || 0) - new Date(a.pub || a.date || 0)),
    storyCount: node.stories.length,
  }))
  const edges = Array.from(edgeMap.values()).map((edge) => ({
    ...edge,
    stories: edge.stories.sort((a, b) => new Date(b.pub || b.date || 0) - new Date(a.pub || a.date || 0)),
    storyCount: edge.stories.length,
    evidenceStatus: 'Co-mention — inferred association',
    context: Object.entries(edge.contexts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Industry coverage',
  }))

  const degree = new Map()
  edges.forEach((edge) => {
    degree.set(edge.source, (degree.get(edge.source) || 0) + edge.storyCount)
    degree.set(edge.target, (degree.get(edge.target) || 0) + edge.storyCount)
  })
  const rankedNodes = nodes.map((node) => ({ ...node, degree: degree.get(node.id) || 0 }))
    .sort((a, b) => b.degree - a.degree || b.storyCount - a.storyCount || a.name.localeCompare(b.name))
  const visibleIds = new Set(rankedNodes.slice(0, 30).map((node) => node.id))
  const visibleNodes = rankedNodes.filter((node) => visibleIds.has(node.id))
  const visibleEdges = edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
    .sort((a, b) => b.storyCount - a.storyCount || a.id.localeCompare(b.id))
    .slice(0, 75)

  return {
    nodes,
    edges,
    visibleNodes,
    visibleEdges,
    storyEntities,
    getNode: (id) => nodes.find((node) => node.id === id),
    getEdge: (id) => edges.find((edge) => edge.id === id),
    forStory: (storyId) => (storyEntities.get(storyId) || []).map((id) => nodes.find((node) => node.id === id)).filter(Boolean),
    relatedStories: (entityId, limit = 8) => {
      const related = new Map()
      edges.filter((edge) => edge.source === entityId || edge.target === entityId).forEach((edge) => {
        edge.stories.forEach((story) => related.set(story.id, story))
      })
      return Array.from(related.values()).sort((a, b) => new Date(b.pub || b.date || 0) - new Date(a.pub || a.date || 0)).slice(0, limit)
    },
  }
}

export function matchEvidenceStories(evidence = [], headlines = []) {
  return evidence.map((claim) => {
    const wanted = normalize(claim.replace(/^source:\s*/i, ''))
    const candidates = headlines.map((story) => {
      const title = normalize(story.title)
      if (!wanted || !title) return { story, score: 0 }
      if (title.includes(wanted) || wanted.includes(title)) return { story, score: 1 }
      const words = wanted.split(' ').filter((word) => word.length > 2)
      const titleWords = new Set(title.split(' '))
      const overlap = words.filter((word) => titleWords.has(word)).length
      return { story, score: words.length ? overlap / words.length : 0 }
    }).sort((a, b) => b.score - a.score)
    return { claim, story: candidates[0]?.score >= 0.6 ? candidates[0].story : null }
  })
}
