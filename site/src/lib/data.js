// Static data helpers. Headlines/theses are generated at build time by
// scripts/build-data.py into public/data/*.json.
let cache = null

export async function loadData() {
  if (cache) return cache
  const [headlines, theses, meta] = await Promise.all([
    fetch('data/headlines.json').then((r) => r.json()),
    fetch('data/theses.json').then((r) => r.json()),
    fetch('data/meta.json').then((r) => r.json()).catch(() => ({})),
  ])
  cache = { headlines, theses, meta }
  return cache
}

export function timeAgo(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function excerpt(text, n = 200) {
  const s = (text || '').replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
}
