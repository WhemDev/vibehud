'use client'

import type { AgentMap } from '../schema'
import { normalizeRoute, type ValidationReport } from '../validate'
import type { Selection } from './DetailDrawer'
import { statusColor, theme } from './theme'
import type { ApiHealth } from './useApiHealth'

const NODE_W = 150
const NODE_H = 52
const BAND_H = 44
const COL_GAP = 220
const ROW_GAP = 80
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
  id: string
  x: number
  y: number
  w: number
  h: number
}

/** BFS layering from the root page ('/' if declared, else the first page). */
function layoutPages(map: AgentMap): { pos: Map<string, Positioned>; bottom: number } {
  const byId = new Map(map.pages.map((p) => [p.id, p]))
  const children = new Map<string, string[]>()
  for (const r of map.relations) {
    if (!byId.has(r.from) || !byId.has(r.to)) continue
    children.set(r.from, [...(children.get(r.from) ?? []), r.to])
  }

  const root = map.pages.find((p) => normalizeRoute(p.path) === '/') ?? map.pages[0]
  const layerOf = new Map<string, number>()
  if (root) {
    const queue: string[] = [root.id]
    layerOf.set(root.id, 0)
    while (queue.length) {
      const id = queue.shift()!
      for (const child of children.get(id) ?? []) {
        if (!layerOf.has(child)) {
          layerOf.set(child, layerOf.get(id)! + 1)
          queue.push(child)
        }
      }
    }
  }
  const maxLayer = Math.max(0, ...layerOf.values())
  for (const p of map.pages) {
    if (!layerOf.has(p.id)) layerOf.set(p.id, maxLayer + 1)
  }

  const rows = new Map<number, number>()
  const pos = new Map<string, Positioned>()
  let bottom = PAD
  for (const p of map.pages) {
    const layer = layerOf.get(p.id)!
    const row = rows.get(layer) ?? 0
    rows.set(layer, row + 1)
    const y = PAD + row * ROW_GAP
    pos.set(p.id, { id: p.id, x: PAD + layer * COL_GAP, y, w: NODE_W, h: NODE_H })
    bottom = Math.max(bottom, y + NODE_H)
  }
  return { pos, bottom }
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
  const { pos, bottom } = layoutPages(map)
  const apiY = bottom + 46
  map.apis.forEach((a, i) => {
    pos.set(a.id, { id: a.id, x: PAD + i * (NODE_W + 44), y: apiY, w: NODE_W, h: BAND_H })
  })
  const sysY = map.apis.length > 0 ? apiY + BAND_H + 46 : apiY
  map.systems.forEach((s, i) => {
    pos.set(s.id, { id: s.id, x: PAD + i * (NODE_W + 44), y: sysY, w: NODE_W, h: BAND_H })
  })

  const missing = new Set(report?.missing ?? [])
  const apiMissing = new Set(report?.apiMissing ?? [])

  const all = [...pos.values()]
  const width = Math.max(...all.map((n) => n.x + n.w), 300) + PAD + 4
  const height = Math.max(...all.map((n) => n.y + n.h), 120) + PAD + 4

  if (all.length === 0) {
    return <p style={{ fontSize: 14, color: theme.muted }}>Nothing declared yet.</p>
  }

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

  const bandLabel = (y: number, text: string) => (
    <text
      x={PAD}
      y={y - 14}
      fontSize={10}
      fontWeight={800}
      letterSpacing="0.1em"
      fontFamily={theme.fontBody}
      fill={theme.muted}
    >
      {text}
    </text>
  )

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
        {map.apis.length > 0 && bandLabel(apiY, 'API ROUTES')}
        {map.systems.length > 0 && bandLabel(sysY, 'SYSTEMS')}
        {map.relations.map((r, i) => {
          const a = pos.get(r.from)
          const b = pos.get(r.to)
          if (!a || !b) return null
          const vertical = Math.abs(b.y - a.y) > ROW_GAP
          const edgeOpacity = Math.min(
            opacityOf.get(r.from) ?? 1,
            opacityOf.get(r.to) ?? 1,
          )
          return (
            <line
              key={i}
              x1={vertical ? a.x + a.w / 2 : a.x + a.w}
              y1={vertical ? a.y + a.h : a.y + a.h / 2}
              x2={vertical ? b.x + b.w / 2 : b.x}
              y2={vertical ? b.y : b.y + b.h / 2}
              stroke={theme.line}
              strokeWidth={1.5}
              opacity={edgeOpacity}
              strokeDasharray={r.type === 'nav' ? undefined : '4 3'}
              markerEnd="url(#hud-arrow)"
            />
          )
        })}
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
                <g>
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
                </g>
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
