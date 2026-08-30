'use client'

import type { AgentMap, PageNode } from '../schema'
import { normalizeRoute, type ValidationReport } from '../validate'
import { statusColor, theme } from './theme'

const NODE_W = 150
const NODE_H = 52
const COL_GAP = 220
const ROW_GAP = 80
const PAD = 28

interface Positioned {
  page: PageNode
  x: number
  y: number
}

/** BFS layering from the root page ('/' if declared, else the first page). */
function layout(map: AgentMap): Positioned[] {
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
  const out: Positioned[] = []
  for (const p of map.pages) {
    const layer = layerOf.get(p.id)!
    const row = rows.get(layer) ?? 0
    rows.set(layer, row + 1)
    out.push({ page: p, x: PAD + layer * COL_GAP, y: PAD + row * ROW_GAP })
  }
  return out
}

export function MapView({ map, report }: { map: AgentMap; report?: ValidationReport }) {
  const nodes = layout(map)
  const pos = new Map(nodes.map((n) => [n.page.id, n]))
  const missing = new Set(report?.missing ?? [])

  const width = Math.max(...nodes.map((n) => n.x + NODE_W), 300) + PAD + 4
  const height = Math.max(...nodes.map((n) => n.y + NODE_H), 120) + PAD + 4

  if (map.pages.length === 0) {
    return <p style={{ fontSize: 14, color: theme.muted }}>No pages declared yet.</p>
  }

  return (
    <div
      style={{
        overflowX: 'auto',
        background: theme.bg,
        border: `${theme.bw}px solid ${theme.line}`,
        boxShadow: theme.shadow,
      }}
    >
      <svg width={width} height={height} role="img" aria-label="Page map">
        <defs>
          <marker id="hud-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill={theme.line} />
          </marker>
        </defs>
        {map.relations.map((r, i) => {
          const a = pos.get(r.from)
          const b = pos.get(r.to)
          if (!a || !b) return null
          return (
            <line
              key={i}
              x1={a.x + NODE_W}
              y1={a.y + NODE_H / 2}
              x2={b.x}
              y2={b.y + NODE_H / 2}
              stroke={theme.line}
              strokeWidth={1.5}
              strokeDasharray={r.type === 'nav' ? undefined : '4 3'}
              markerEnd="url(#hud-arrow)"
            />
          )
        })}
        {nodes.map(({ page, x, y }) => {
          const isMissing = missing.has(normalizeRoute(page.path))
          return (
            <g key={page.id}>
              {!isMissing && (
                <rect x={x + 3} y={y + 3} width={NODE_W} height={NODE_H} fill={theme.line} />
              )}
              <rect
                x={x}
                y={y}
                width={NODE_W}
                height={NODE_H}
                fill={theme.card}
                stroke={isMissing ? theme.danger : theme.line}
                strokeWidth={theme.bw}
                strokeDasharray={isMissing ? '5 3' : undefined}
              />
              <circle cx={x + 14} cy={y + 18} r={4.5} fill={statusColor[page.status]} />
              <text
                x={x + 26}
                y={y + 22}
                fontSize={13}
                fontWeight={700}
                fontFamily={theme.fontBody}
                fill={theme.ink}
              >
                {page.label}
              </text>
              <text
                x={x + 26}
                y={y + 40}
                fontSize={10}
                fontFamily={theme.fontMono}
                fill={isMissing ? theme.danger : theme.muted}
              >
                {isMissing ? `${page.path} · missing` : page.path}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
