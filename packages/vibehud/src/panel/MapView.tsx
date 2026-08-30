'use client'

import dagre from '@dagrejs/dagre'
import type { AgentMap } from '../schema'
import { normalizeRoute, type ValidationReport } from '../validate'
import type { Selection } from './DetailDrawer'
import { statusColor, theme } from './theme'
import type { ApiHealth } from './useApiHealth'

const NODE_W = 150
const PAGE_H = 52
const BAND_H = 44
const PAD = 28
const DIM = 0.22

const HEALTH_COLOR: Record<ApiHealth, string> = {
  up: theme.ok,
  error: theme.danger,
  missing: theme.danger,
  down: theme.muted,
  unknown: theme.muted,
}

interface Positioned {
  x: number
  y: number
  w: number
  h: number
}

interface LaidOut {
  pos: Map<string, Positioned>
  edges: { points: { x: number; y: number }[]; type: string; from: string; to: string }[]
  width: number
  height: number
}

/**
 * Layered graph layout via dagre (Sugiyama-style): handles multi-parent
 * nodes, minimizes crossings, and lays out disconnected components side by
 * side — pages, APIs, and systems in one unified graph.
 */
function layoutGraph(map: AgentMap): LaidOut {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 22, ranksep: 64, marginx: PAD, marginy: PAD })
  g.setDefaultEdgeLabel(() => ({}))

  for (const p of map.pages) g.setNode(p.id, { width: NODE_W, height: PAGE_H })
  for (const a of map.apis) g.setNode(a.id, { width: NODE_W, height: BAND_H })
  for (const s of map.systems) g.setNode(s.id, { width: NODE_W, height: BAND_H })
  for (const r of map.relations) {
    if (g.hasNode(r.from) && g.hasNode(r.to)) g.setEdge(r.from, r.to)
  }

  dagre.layout(g)

  const pos = new Map<string, Positioned>()
  for (const id of g.nodes()) {
    const n = g.node(id)
    pos.set(id, { x: n.x - n.width / 2, y: n.y - n.height / 2, w: n.width, h: n.height })
  }
  const edges = g.edges().map((e) => {
    const rel = map.relations.find((r) => r.from === e.v && r.to === e.w)
    return { points: g.edge(e).points ?? [], type: rel?.type ?? 'nav', from: e.v, to: e.w }
  })
  const graph = g.graph()
  return {
    pos,
    edges,
    width: Math.max(graph.width ?? 0, 300) + 4,
    height: Math.max(graph.height ?? 0, 120) + 4,
  }
}

export function MapView({
  map,
  report,
  selection,
  onSelect,
  query = '',
  health = {},
}: {
  map: AgentMap
  report?: ValidationReport
  selection?: Selection
  onSelect?: (s: Selection) => void
  query?: string
  health?: Record<string, ApiHealth>
}) {
  if (map.pages.length === 0 && map.apis.length === 0 && map.systems.length === 0) {
    return <p style={{ fontSize: 14, color: theme.muted }}>Nothing declared yet.</p>
  }

  const { pos, edges, width, height } = layoutGraph(map)
  const missing = new Set(report?.missing ?? [])
  const apiMissing = new Set(report?.apiMissing ?? [])

  // Focus set: the selected node plus its direct neighbors.
  const focus = new Set<string>()
  if (selection && selection.kind !== 'task' && pos.has(selection.id)) {
    focus.add(selection.id)
    for (const r of map.relations) {
      if (r.from === selection.id) focus.add(r.to)
      if (r.to === selection.id) focus.add(r.from)
    }
  }
  const q = query.trim().toLowerCase()
  const matches = (label: string, path?: string) =>
    label.toLowerCase().includes(q) || (path ?? '').toLowerCase().includes(q)
  const nodeOpacity = (id: string, label: string, path?: string) => {
    if (q !== '') return matches(label, path) ? 1 : DIM
    if (focus.size > 0) return focus.has(id) ? 1 : DIM
    return 1
  }
  const opacityOf = new Map<string, number>()
  for (const p of map.pages) opacityOf.set(p.id, nodeOpacity(p.id, p.label, p.path))
  for (const a of map.apis) opacityOf.set(a.id, nodeOpacity(a.id, a.label, a.path))
  for (const s of map.systems) opacityOf.set(s.id, nodeOpacity(s.id, s.label))

  const isSelected = (id: string) =>
    selection != null && selection.kind !== 'task' && selection.id === id

  return (
    <div
      style={{
        overflowX: 'auto',
        background: theme.bg,
        border: `${theme.bw}px solid ${theme.line}`,
        boxShadow: theme.shadow,
      }}
    >
      <svg width={width} height={height} role="img" aria-label="App map">
        <defs>
          <marker id="hud-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill={theme.line} />
          </marker>
        </defs>
        {edges.map((e, i) => (
          <polyline
            key={i}
            points={e.points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={theme.line}
            strokeWidth={1.5}
            opacity={Math.min(opacityOf.get(e.from) ?? 1, opacityOf.get(e.to) ?? 1)}
            strokeDasharray={e.type === 'nav' ? undefined : '4 3'}
            markerEnd="url(#hud-arrow)"
          />
        ))}
        {map.pages.map((page) => {
          const n = pos.get(page.id)!
          const isMissing = missing.has(normalizeRoute(page.path))
          const sel = isSelected(page.id)
          return (
            <g
              key={page.id}
              opacity={opacityOf.get(page.id)}
              onClick={() => onSelect?.({ kind: 'page', id: page.id })}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
            >
              {!isMissing && <rect x={n.x + 3} y={n.y + 3} width={n.w} height={n.h} fill={theme.line} />}
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                fill={sel ? theme.warnBg : theme.card}
                stroke={isMissing ? theme.danger : theme.line}
                strokeWidth={sel ? 3 : theme.bw}
                strokeDasharray={isMissing ? '5 3' : undefined}
              />
              <circle cx={n.x + 14} cy={n.y + 18} r={4.5} fill={statusColor[page.status]} />
              <text x={n.x + 26} y={n.y + 22} fontSize={13} fontWeight={700} fontFamily={theme.fontBody} fill={theme.ink}>
                {page.label}
              </text>
              <text
                x={n.x + 26}
                y={n.y + 40}
                fontSize={10}
                fontFamily={theme.fontMono}
                fill={isMissing ? theme.danger : theme.muted}
              >
                {isMissing ? `${page.path} · missing` : page.path}
              </text>
            </g>
          )
        })}
        {map.apis.map((api) => {
          const n = pos.get(api.id)!
          const isMissing = apiMissing.has(normalizeRoute(api.path))
          const sel = isSelected(api.id)
          const h = health[api.id]
          return (
            <g
              key={api.id}
              opacity={opacityOf.get(api.id)}
              onClick={() => onSelect?.({ kind: 'api', id: api.id })}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
            >
              {!isMissing && <rect x={n.x + 3} y={n.y + 3} width={n.w} height={n.h} fill={theme.line} />}
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                fill={isMissing ? theme.card : theme.tagBg}
                stroke={isMissing ? theme.danger : sel ? theme.warnBg : theme.line}
                strokeWidth={sel ? 3 : theme.bw}
                strokeDasharray={isMissing ? '5 3' : undefined}
              />
              <text
                x={n.x + 12}
                y={n.y + 18}
                fontSize={10}
                fontWeight={700}
                fontFamily={theme.fontMono}
                fill={isMissing ? theme.danger : theme.tagInk}
              >
                {api.methods.join(' ')}
              </text>
              <text
                x={n.x + 12}
                y={n.y + 33}
                fontSize={10}
                fontFamily={theme.fontMono}
                fill={isMissing ? theme.danger : theme.card}
              >
                {isMissing ? `${api.path} · missing` : api.path}
              </text>
              {h && h !== 'unknown' && !isMissing && (
                <rect
                  x={n.x + n.w - 16}
                  y={n.y + 8}
                  width={9}
                  height={9}
                  fill={HEALTH_COLOR[h]}
                  stroke={theme.card}
                  strokeWidth={1.5}
                >
                  <title>{`health: ${h}`}</title>
                </rect>
              )}
            </g>
          )
        })}
        {map.systems.map((sys) => {
          const n = pos.get(sys.id)!
          const sel = isSelected(sys.id)
          return (
            <g
              key={sys.id}
              opacity={opacityOf.get(sys.id)}
              onClick={() => onSelect?.({ kind: 'system', id: sys.id })}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
            >
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                fill={sel ? theme.warnBg : theme.well}
                stroke={theme.line}
                strokeWidth={sel ? 3 : theme.bw}
              />
              <rect
                x={n.x + 4}
                y={n.y + 4}
                width={n.w - 8}
                height={n.h - 8}
                fill="none"
                stroke={theme.line}
                strokeWidth={1}
              />
              <circle cx={n.x + 16} cy={n.y + BAND_H / 2} r={4.5} fill={statusColor[sys.status]} />
              <text x={n.x + 28} y={n.y + 19} fontSize={12} fontWeight={700} fontFamily={theme.fontBody} fill={theme.ink}>
                {sys.label}
              </text>
              {sys.kind && (
                <text x={n.x + 28} y={n.y + 33} fontSize={9} fontFamily={theme.fontMono} fill={theme.muted}>
                  {sys.kind}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
