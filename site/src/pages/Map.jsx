import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadData, timeAgo, excerpt } from '../lib/data.js'
import { buildSignalGraph } from '../lib/signalGraph.js'

const COLORS = { 'AI labs':'#f17b62', 'Big Tech':'#d8f36a', 'Compute & infrastructure':'#8da1ff', 'AI products':'#9ed8c1', 'Data & platforms':'#c5a3ed', 'Open source & tools':'#f4c96a', Investors:'#eaa6c8', Security:'#b3c5a0' }

function layoutGraph(nodes, edges) {
  const width = 900, height = 580, cx = width / 2, cy = height / 2
  const positions = new Map()
  nodes.forEach((node, i) => {
    const angle = 2 * Math.PI * i / Math.max(nodes.length, 1) - Math.PI / 2
    const radius = Math.min(width, height) * (.28 + (i % 3) * .04)
    positions.set(node.id, { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  })
  for (let step = 0; step < 65; step += 1) {
    const next = new Map()
    nodes.forEach((node) => {
      const p = positions.get(node.id)
      let fx = (cx - p.x) * .008, fy = (cy - p.y) * .008
      nodes.forEach((other) => {
        if (other.id === node.id) return
        const q = positions.get(other.id), dx = p.x - q.x, dy = p.y - q.y
        const d2 = Math.max(dx * dx + dy * dy, 100), d = Math.sqrt(d2)
        fx += dx / d * (850 / d2); fy += dy / d * (850 / d2)
      })
      edges.forEach((edge) => {
        if (edge.source !== node.id && edge.target !== node.id) return
        const q = positions.get(edge.source === node.id ? edge.target : edge.source)
        if (!q) return
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.max(Math.hypot(dx, dy), 1)
        const f = (d - 145) * .006 * Math.min(edge.storyCount, 4)
        fx += dx / d * f; fy += dy / d * f
      })
      next.set(node.id, { x: Math.max(38, Math.min(width - 38, p.x + fx)), y: Math.max(38, Math.min(height - 38, p.y + fy)) })
    })
    next.forEach((p, id) => positions.set(id, p))
  }
  return { width, height, positions }
}

function Evidence({ story }) {
  return <a className="graph-evidence-item" href={story.link} target="_blank" rel="noreferrer">
    <span className="graph-evidence-meta">{story.source || 'Source'} <span>/</span> {story.pub ? new Date(story.pub).toLocaleDateString() : story.date || 'Date unavailable'} <span>/</span> {timeAgo(story.pub || story.date)}</span>
    <b>{story.title}</b>{story.summary && <p>{excerpt(story.summary, 135)}</p>}
    <span className="graph-evidence-open">Open original source ↗</span>
  </a>
}

export default function MapPage() {
  const [data, setData] = useState(null)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('All entity types')
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [selectedEdgeId, setSelectedEdgeId] = useState('')
  const [params] = useSearchParams()
  useEffect(() => { loadData().then(setData).catch(() => setData({ headlines: [], theses: [], meta: {} })) }, [])
  const graph = useMemo(() => buildSignalGraph(data?.headlines || []), [data])
  const kinds = useMemo(() => ['All entity types', ...new Set(graph.nodes.map((n) => n.kind))], [graph.nodes])
  const nodes = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (q ? graph.nodes : graph.visibleNodes).filter((n) =>
      (kind === 'All entity types' || n.kind === kind) &&
      (!q || `${n.name} ${n.kind}`.toLowerCase().includes(q))
    )
    if (!q) return matches
    const matchIds = new Set(matches.map((n) => n.id))
    const expanded = new Set(matchIds)
    graph.edges.forEach((edge) => {
      if (matchIds.has(edge.source)) expanded.add(edge.target)
      if (matchIds.has(edge.target)) expanded.add(edge.source)
    })
    return graph.nodes.filter((n) => expanded.has(n.id) && (kind === 'All entity types' || n.kind === kind))
      .sort((a, b) => Number(matchIds.has(b.id)) - Number(matchIds.has(a.id)) || b.storyCount - a.storyCount)
      .slice(0, 30)
  }, [graph, kind, query])
  const ids = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes])
  const edges = useMemo(() => (query.trim() ? graph.edges : graph.visibleEdges)
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .sort((a, b) => b.storyCount - a.storyCount).slice(0, 75), [graph.edges, graph.visibleEdges, ids, query])
  const layout = useMemo(() => layoutGraph(nodes, edges), [nodes, edges])
  const selectedNode = graph.getNode(selectedNodeId)
  const selectedEdge = graph.getEdge(selectedEdgeId)
  const relatedEdges = selectedNode ? graph.edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).sort((a, b) => b.storyCount - a.storyCount).slice(0, 8) : []
  useEffect(() => {
    const entity = params.get('entity')
    if (entity && graph.getNode(entity)) { setSelectedNodeId(entity); setSelectedEdgeId(''); setQuery(graph.getNode(entity).name) }
    else if (!selectedNodeId && graph.visibleNodes[0]) setSelectedNodeId(graph.visibleNodes[0].id)
  }, [graph, params])
  const chooseNode = (id) => { setSelectedNodeId(id); setSelectedEdgeId('') }
  const chooseEdge = (id) => { setSelectedEdgeId(id); setSelectedNodeId('') }

  if (!data) return <div className="page"><div className="loading">Building the evidence graph…</div></div>
  return <div className="page intelligence-page graph-page">
    <div className="page-kicker"><span className="eyebrow-dot" /> FIELD GUIDE / 01</div>
    <section className="subpage-hero map-hero"><div>
      <div className="eyebrow">CONNECTING THE DOTS</div><h1>Follow the names.<br /><em>Find the patterns.</em></h1>
      <p>Explore which companies, labs, investors, and infrastructure players show up together across the coverage. Every connection leads back to its source.</p>
    </div><div className="map-hero-art" aria-hidden="true"><svg viewBox="0 0 300 220">
      <g className="network-lines"><line x1="150" y1="110" x2="52" y2="45" /><line x1="150" y1="110" x2="248" y2="42" /><line x1="150" y1="110" x2="257" y2="158" /><line x1="150" y1="110" x2="64" y2="183" /><line x1="150" y1="110" x2="150" y2="20" /><line x1="52" y1="45" x2="64" y2="183" /><line x1="248" y1="42" x2="257" y2="158" /></g>
      <circle className="network-hub" cx="150" cy="110" r="31" /><text className="network-hub-text" x="150" y="116" textAnchor="middle">α</text>
      <circle className="network-point lime" cx="52" cy="45" r="11" /><circle className="network-point coral" cx="248" cy="42" r="8" /><circle className="network-point blue" cx="257" cy="158" r="12" /><circle className="network-point violet" cx="64" cy="183" r="7" /><circle className="network-point gold" cx="150" cy="20" r="6" />
    </svg></div></section>
    <section className="graph-intro">
      <div><span className="eyebrow">A LIVING EVIDENCE MAP</span><p>Nodes are entities recognized in story titles and summaries. A line means two entities appeared in the same article—not that one caused, funded, or partnered with the other.</p></div>
      <div className="graph-stat"><strong>{graph.nodes.length}</strong><span>ENTITIES FOUND</span></div>
      <div className="graph-stat"><strong>{graph.edges.length}</strong><span>CO-MENTION LINKS</span></div>
      <div className="graph-stat"><strong>{data.headlines.length}</strong><span>SOURCE STORIES</span></div>
    </section>
    <section className="graph-workspace">
      <div className="graph-main">
        <div className="graph-controls">
          <label className="feed-search graph-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a company, lab, or investor…" aria-label="Search graph entities" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}</label>
          <label className="graph-kind-select"><span className="eyebrow">FILTER BY TYPE</span><select value={kind} onChange={(e) => setKind(e.target.value)}>{kinds.map((k) => <option key={k}>{k}</option>)}</select></label>
        </div>
        <div className="graph-legend"><span><i className="graph-legend-node" /> Entity</span><span><i className="graph-legend-line" /> Shared source coverage</span><span className="graph-legend-note">Line weight = shared article count</span></div>
        <div className="signal-graph-canvas">{nodes.length < 2 ? <div className="graph-empty">No connected entities match this filter. Try another name or entity type.</div> : <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label="Interactive graph of entities connected by shared source articles">
          <g>{edges.map((edge) => { const a = layout.positions.get(edge.source), b = layout.positions.get(edge.target); if (!a || !b) return null; const active = selectedEdgeId === edge.id || selectedNodeId === edge.source || selectedNodeId === edge.target; return <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={active ? 'signal-graph-edge active' : 'signal-graph-edge'} strokeWidth={1 + Math.min(4, Math.log2(edge.storyCount + 1))} opacity={selectedNodeId && !active ? .12 : .32} onClick={() => chooseEdge(edge.id)} role="button" tabIndex={0} aria-label={`${graph.getNode(edge.source)?.name} and ${graph.getNode(edge.target)?.name} appear together in ${edge.storyCount} stories`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') chooseEdge(edge.id) }} /> })}</g>
          <g>{nodes.map((node) => { const p = layout.positions.get(node.id); if (!p) return null; const radius = Math.min(27, 11 + Math.sqrt(node.storyCount) * 2.1); const active = selectedNodeId === node.id || (selectedEdge && [selectedEdge.source, selectedEdge.target].includes(node.id)); return <g key={node.id} className={active ? 'signal-graph-node active' : 'signal-graph-node'} transform={`translate(${p.x} ${p.y})`} role="button" tabIndex={0} aria-label={`Select ${node.name}, mentioned in ${node.storyCount} stories`} onClick={() => chooseNode(node.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') chooseNode(node.id) }}>
            <circle r={radius + 8} className="signal-graph-halo" /><circle r={radius} fill={COLORS[node.kind] || '#d8f36a'} className="signal-graph-node-dot" /><text y={radius + 16} textAnchor="middle">{node.name.length > 18 ? `${node.name.slice(0, 16)}…` : node.name}</text><title>{node.name} · {node.storyCount} source stories</title>
          </g> })}</g>
        </svg>}</div>
        <div className="graph-footnote"><span>Showing {nodes.length} entities and {edges.length} co-mention links.</span><span>Coverage snapshot last refreshed {data.meta?.generated ? new Date(data.meta.generated).toLocaleString() : 'this build'}; not a real-time market feed.</span></div>
      </div>
      <aside className="graph-inspector">
        {selectedEdge ? <>
          <div className="graph-inspector-top"><span className="eyebrow">CONNECTION EVIDENCE</span><button type="button" onClick={() => { setSelectedEdgeId(''); setSelectedNodeId(selectedEdge.source) }} aria-label="Close connection details">×</button></div>
          <h2>{graph.getNode(selectedEdge.source)?.name}<span className="graph-title-amp"> & </span>{graph.getNode(selectedEdge.target)?.name}</h2>
          <p className="graph-inspector-lede">These entities appeared together in {selectedEdge.storyCount} {selectedEdge.storyCount === 1 ? 'source story' : 'source stories'}. This is a coverage association, not proof of a direct relationship.</p>
          <div className="graph-context-pill">{selectedEdge.context}</div><div className="graph-status-pill"><span>STATUS</span>{selectedEdge.evidenceStatus} · evidence from {selectedEdge.storyCount} {selectedEdge.storyCount === 1 ? "article" : "articles"}</div><div className="graph-evidence-heading">SOURCE TRAIL <span>{selectedEdge.storyCount}</span></div>
          <div className="graph-evidence-list">{selectedEdge.stories.slice(0, 8).map((story) => <Evidence key={story.id} story={story} />)}</div>
        </> : selectedNode ? <>
          <div className="graph-inspector-top"><span className="eyebrow">ENTITY PROFILE</span><span className="graph-kind-label">{selectedNode.kind}</span></div>
          <h2>{selectedNode.name}<span className="heading-period">.</span></h2>
          <div className="graph-entity-stats"><div><strong>{selectedNode.storyCount}</strong><span>STORIES MENTIONING IT</span></div><div><strong>{relatedEdges.length}</strong><span>CONNECTED ENTITIES</span></div></div>
          <p className="graph-inspector-lede">Explore the coverage around {selectedNode.name}. Each connection below leads to the source stories used to form it.</p>
          <div className="graph-evidence-heading">RELATED ENTITIES <span>{relatedEdges.length}</span></div>
          <div className="graph-related-entities">{relatedEdges.map((edge) => { const id = edge.source === selectedNode.id ? edge.target : edge.source; const other = graph.getNode(id); return <button key={edge.id} type="button" onClick={() => chooseEdge(edge.id)}><span><b>{other?.name}</b><small>{edge.context}</small></span><span className="graph-related-count">{edge.storyCount} {edge.storyCount === 1 ? 'story' : 'stories'} ↗</span></button> })}</div>
          <div className="graph-evidence-heading">LATEST COVERAGE <span>{selectedNode.storyCount}</span></div><div className="graph-evidence-list">{selectedNode.stories.slice(0, 5).map((story) => <Evidence key={story.id} story={story} />)}</div>
          <Link className="btn btn-dark btn-full graph-entity-cta" to={`/intelligence?entity=${selectedNode.id}`}>Explore the wider signal ↗</Link>
        </> : <div className="graph-empty-inspector"><span className="eyebrow">SELECT A NODE OR LINE</span><h2>Every connection needs a source.</h2><p>Choose an entity to see its coverage, or a line to inspect the stories connecting two names.</p></div>}
      </aside>
    </section>
    <section className="graph-method-note"><span className="eyebrow">METHODOLOGY / 01</span><p>Entity matching uses a curated alias list and story titles/summaries. It can miss aliases and misread ambiguous names. Co-mention is a research lead, not evidence of causation or a verified business relationship. Open the sources before drawing a conclusion.</p></section>
    <div className="page-bottom-cta"><div><span className="eyebrow">FROM COVERAGE TO CONVICTION</span><h2>Trace the signals behind a thesis.</h2></div><Link className="btn btn-dark" to="/intelligence">Explore Intelligence ↗</Link></div>
  </div>
}